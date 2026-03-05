import { useState, useEffect } from 'react';
import { Plus, X, Wallet, CreditCard, Smartphone, FileText, CheckSquare, Square } from 'lucide-react';
import { useApp, patientNeedsConsultation, getConsultationPricing, getBusinessDate } from '@/store/AppContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { patientsService } from '@/services/patientsService';
import type { Patient, Invoice, InvoicePayment } from '@/types';

interface ProcedureItem {
  id: string;
  procedure: string;
  procedureAr: string;
  cost: number;
  isFollowUp?: boolean;
  isConsultation?: boolean; // Mark consultation as mandatory
  invoiceId?: string; // Link to original invoice for follow-up payments
}

interface PaymentFormProps {
  patient?: Patient; // Optional: if provided, patient is pre-selected
  initialProcedure?: string; // DEPRECATED: No longer used - procedures come from dental chart
  initialProcedureAr?: string; // DEPRECATED: No longer used - procedures come from dental chart
  doctorId?: string; // Optional: treating doctor for new invoices
  // Billing mode helps distinguish between new procedures and clinical follow-ups
  // - 'auto': old behavior based only on outstanding invoices + initialProcedure
  // - 'follow_up': visit is a follow-up; default is to NOT create a new procedure/invoice
  // - 'new': always treat as a brand new procedure, even if similar ones exist
  billingMode?: 'auto' | 'follow_up' | 'new'; // DEPRECATED: No longer used with new workflow
  onClose: () => void;
  onSave: () => void;
}

export function PaymentForm({ 
  patient: preSelectedPatient, 
  initialProcedure, 
  initialProcedureAr, 
  doctorId,
   billingMode = 'auto',
  onClose, 
  onSave 
}: PaymentFormProps) {
  const { state, dispatch } = useApp();
  const isRTL = state.ui.language === 'ar';
  const isAssistant = state.activeDoctor.role === 'assistant';
  const nonAssistantDoctors = state.doctors.filter(d => d.role !== 'assistant');

  const effectiveBillingMode: 'auto' | 'follow_up' | 'new' = billingMode || 'auto';

  // Use pricing from state if available
  const procedureOptions = state.procedurePricing.length > 0
    ? state.procedurePricing.map(p => ({
        value: p.procedure,
        label: p.procedure,
        labelAr: p.procedureAr,
        defaultCost: p.basePrice,
        isFlexible: p.isFlexible ?? false
      }))
    : [
        { value: 'Check-up', label: 'Check-up', labelAr: 'فحص', defaultCost: 200, isFlexible: false },
        { value: 'Cleaning', label: 'Cleaning', labelAr: 'تنظيف', defaultCost: 300, isFlexible: false },
        { value: 'Filling', label: 'Filling', labelAr: 'حشوة', defaultCost: 500, isFlexible: false },
        { value: 'Root Canal', label: 'Root Canal', labelAr: 'علاج جذور', defaultCost: 1500, isFlexible: false },
        { value: 'Crown', label: 'Crown', labelAr: 'تاج', defaultCost: 2000, isFlexible: false },
        { value: 'Extraction', label: 'Extraction', labelAr: 'خلع', defaultCost: 400, isFlexible: false },
        { value: 'Implant', label: 'Implant', labelAr: 'زراعة', defaultCost: 8000, isFlexible: true },
        { value: 'Braces Adjustment', label: 'Braces Adjustment', labelAr: 'تعديل تقويم', defaultCost: 600, isFlexible: true }
      ];

  // Get procedures from patient's dental chart (what doctor actually did)
  const getProceduresFromDentalChart = (patient: Patient): ProcedureItem[] => {
    const procedures: ProcedureItem[] = [];
    
    // Check if patient needs consultation (every 3 months)
    const needsConsultation = patientNeedsConsultation(patient, state.invoices);
    
    // Add mandatory consultation if needed
    if (needsConsultation) {
      const consultationPricing = getConsultationPricing(state.procedurePricing);
      procedures.push({
        id: 'consultation-mandatory',
        procedure: consultationPricing.procedure,
        procedureAr: consultationPricing.procedureAr,
        cost: consultationPricing.basePrice,
        isFollowUp: false,
        isConsultation: true
      });
    }
    
    // Get procedures from dental chart that don't have invoices yet
    if (patient.dentalTreatments) {
      Object.entries(patient.dentalTreatments).forEach(([toothNum, treatments]) => {
        treatments.forEach((treatment) => {
          // Skip treatments that already have invoices
          // Check if this treatment ID exists in any invoice
          const hasInvoice = state.invoices.some(invoice => 
            invoice.patientId === patient.id && 
            invoice.items.some(item => 
              // Match by treatment ID if available, or by procedure name and date
              item.id === treatment.id || 
              (item.procedure === treatment.type && invoice.createdAt === treatment.date)
            )
          );
          
          if (!hasInvoice) {
            const pricing = state.procedurePricing.find(p => p.procedure === treatment.type);
            procedures.push({
              id: treatment.id,
              procedure: treatment.type,
              procedureAr: pricing?.procedureAr || treatment.type,
              cost: treatment.cost || pricing?.basePrice || 0,
              isFollowUp: false
            });
          }
        });
      });
    }
    
    // If no procedures from dental chart and no consultation needed, add empty row
    if (procedures.length === 0) {
      procedures.push({
        id: '1',
        procedure: '',
        procedureAr: '',
        cost: 0,
        isFollowUp: false
      });
    }
    
    return procedures;
  };

  // Get invoices with outstanding balance for patient
  const getOutstandingInvoices = (patientId: string): Invoice[] => {
    return state.invoices
      .filter(inv => inv.patientId === patientId && inv.remaining > 0)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  // Get initial procedures for selected patient
  const getInitialProceduresForPatient = (patient: Patient): ProcedureItem[] => {
    // NEW LOGIC: Get procedures from dental chart instead of appointment
    return getProceduresFromDentalChart(patient);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(preSelectedPatient || null);
  const [loadingPatientData, setLoadingPatientData] = useState(false);
  const [outstandingInvoices, setOutstandingInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());
  const [procedures, setProcedures] = useState<ProcedureItem[]>(
    preSelectedPatient 
      ? getInitialProceduresForPatient(preSelectedPatient)
      : [{
          id: '1',
          procedure: '',
          procedureAr: '',
          cost: 0,
          isFollowUp: false
        }]
  );
  const [discount, setDiscount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'instapay'>('cash');
  const [treatingDoctorId, setTreatingDoctorId] = useState<string>(
    doctorId ||
      (isAssistant
        ? nonAssistantDoctors[0]?.id || state.ui.activeDoctorId
        : state.ui.activeDoctorId)
  );

  useEffect(() => {
    if (doctorId) {
      setTreatingDoctorId(doctorId);
    }
  }, [doctorId]);

  // Fetch updated patient data with dental treatments from API
  useEffect(() => {
    const fetchPatientWithTreatments = async () => {
      if (!preSelectedPatient) return;
      
      try {
        setLoadingPatientData(true);
        
        // Fetch tooth procedures from API
        const toothProceduresResponse = await patientsService.getToothProcedures(preSelectedPatient.id);
        
        // Transform tooth procedures to dental treatments format
        const dentalTreatments: Record<number, any[]> = {};
        
        // Check if response has byTooth structure (preferred)
        if (toothProceduresResponse.byTooth) {
          // Use byTooth directly - it's already grouped by tooth number
          Object.entries(toothProceduresResponse.byTooth).forEach(([toothNum, procedures]: [string, any]) => {
            dentalTreatments[Number(toothNum)] = procedures.map((proc: any) => ({
              id: proc._id || proc.id,
              type: proc.procedure, // Store procedure name for display (e.g., "Composite Filling")
              procedureType: proc.type, // Store API type for reference (e.g., "filling")
              date: proc.date,
              notes: proc.notes || '',
              cost: proc.price || 0,
              appointmentId: proc.appointmentId
            }));
          });
        } else {
          // Fallback: use procedures array and group manually
          const procedures = toothProceduresResponse.procedures || 
                           (Array.isArray(toothProceduresResponse) ? toothProceduresResponse : []);
          
          procedures.forEach((proc: any) => {
            const toothNum = proc.toothNumber;
            if (!dentalTreatments[toothNum]) {
              dentalTreatments[toothNum] = [];
            }
            dentalTreatments[toothNum].push({
              id: proc._id || proc.id,
              type: proc.procedure,
              procedureType: proc.type,
              date: proc.date,
              notes: proc.notes || '',
              cost: proc.price || 0,
              appointmentId: proc.appointmentId
            });
          });
        }
        
        // Update selected patient with dental treatments
        const updatedPatient = {
          ...preSelectedPatient,
          dentalTreatments
        };
        
        setSelectedPatient(updatedPatient);
        
        // Update procedures from dental chart
        setProcedures(getInitialProceduresForPatient(updatedPatient));
        
      } catch (error) {
        console.error('Error fetching patient dental treatments:', error);
        // Fallback to patient without dental treatments
        setSelectedPatient(preSelectedPatient);
        setProcedures(getInitialProceduresForPatient(preSelectedPatient));
      } finally {
        setLoadingPatientData(false);
      }
    };

    fetchPatientWithTreatments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preSelectedPatient?.id]);

  // Update outstanding invoices when patient changes
  useEffect(() => {
    if (selectedPatient) {
      const invoices = getOutstandingInvoices(selectedPatient.id);
      setOutstandingInvoices(invoices);
      // Auto-select all invoices by default
      setSelectedInvoiceIds(new Set(invoices.map(inv => inv.id)));
      
      // Reset procedures when patient changes
      setProcedures(getInitialProceduresForPatient(selectedPatient));
    } else {
      setOutstandingInvoices([]);
      setSelectedInvoiceIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatient?.id]);

  // Filter patients based on search query (only if no pre-selected patient)
  const filteredPatients = !preSelectedPatient 
    ? state.patients.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nameAr.includes(searchQuery) ||
        p.phone.includes(searchQuery)
      )
    : [];

  // Calculate totals
  const selectedInvoicesTotal = outstandingInvoices
    .filter(inv => selectedInvoiceIds.has(inv.id))
    .reduce((sum, inv) => sum + inv.remaining, 0);
  
  const newProceduresSubtotal = procedures.reduce((sum, proc) => sum + proc.cost, 0);
  const newProceduresTotal = newProceduresSubtotal - discount;
  
  const subtotal = selectedInvoicesTotal + newProceduresSubtotal;
  const total = selectedInvoicesTotal + newProceduresTotal;
  const remaining = total - amountPaid;

  // Toggle invoice selection
  const toggleInvoiceSelection = (invoiceId: string) => {
    const newSet = new Set(selectedInvoiceIds);
    if (newSet.has(invoiceId)) {
      newSet.delete(invoiceId);
    } else {
      newSet.add(invoiceId);
    }
    setSelectedInvoiceIds(newSet);
  };

  // Toggle select all invoices
  const toggleSelectAll = () => {
    if (selectedInvoiceIds.size === outstandingInvoices.length) {
      setSelectedInvoiceIds(new Set());
    } else {
      setSelectedInvoiceIds(new Set(outstandingInvoices.map(inv => inv.id)));
    }
  };

  const handleAddProcedure = () => {
    const newProcedure: ProcedureItem = {
      id: Date.now().toString(),
      procedure: '',
      procedureAr: '',
      cost: 0,
      isFollowUp: false
    };
    setProcedures([...procedures, newProcedure]);
  };

  const handleRemoveProcedure = (id: string) => {
    // Don't allow removing mandatory consultation
    const proc = procedures.find(p => p.id === id);
    if (proc?.isConsultation) {
      return;
    }
    
    if (procedures.length === 1) {
      return;
    }
    setProcedures(procedures.filter(p => p.id !== id));
  };

  const handleProcedureChange = (id: string, value: string) => {
    // Don't allow changing mandatory consultation
    const proc = procedures.find(p => p.id === id);
    if (proc?.isConsultation) {
      return;
    }
    
    const selectedProc = procedureOptions.find(p => p.value === value);
    if (selectedProc) {
      setProcedures(procedures.map(p => 
        p.id === id 
          ? { ...p, procedure: selectedProc.value, procedureAr: selectedProc.labelAr, cost: selectedProc.defaultCost, isFollowUp: false }
          : p
      ));
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchQuery('');
    setProcedures(getInitialProceduresForPatient(patient));
  };

  const handleSave = () => {
    if (!selectedPatient) return;

    const today = getBusinessDate(); // Use business date instead of actual date
    const nowIso = new Date().toISOString();
    const invoiceDoctorId = isAssistant ? treatingDoctorId : (doctorId || state.ui.activeDoctorId);
    let remainingPayment = amountPaid;
    
    // First, handle payments for selected outstanding invoices
    const selectedInvoices = outstandingInvoices.filter(inv => selectedInvoiceIds.has(inv.id));
    
    selectedInvoices.forEach(invoice => {
      if (remainingPayment > 0) {
        const paymentForThisInvoice = Math.min(remainingPayment, invoice.remaining);
        
        if (paymentForThisInvoice > 0) {
          const beforeRemaining = invoice.remaining;
          const afterRemaining = invoice.remaining - paymentForThisInvoice;

          const paymentEntry: InvoicePayment = {
            id: `pay-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            amount: paymentForThisInvoice,
            method: paymentMethod,
            paidAt: nowIso,
            paidDate: today,
            beforeRemaining,
            afterRemaining,
            createdByDoctorId: state.ui.activeDoctorId,
          };

          const updatedInvoice = {
            ...invoice,
            paid: invoice.paid + paymentForThisInvoice,
            remaining: afterRemaining,
            status: afterRemaining === 0 
              ? 'paid' as const 
              : 'partial' as const
          };

          const updatedInvoiceWithPayments: Invoice = {
            ...updatedInvoice,
            paymentMethod,
            payments: [...(invoice.payments || []), paymentEntry],
          };
          
          dispatch({ type: 'UPDATE_INVOICE', payload: updatedInvoiceWithPayments });
          remainingPayment -= paymentForThisInvoice;
          
          // Check if this invoice contains consultation and was paid
          const hasConsultation = invoice.items.some(item => item.procedure === 'Consultation');
          if (hasConsultation && paymentForThisInvoice > 0) {
            // Update patient consultation tracking
            dispatch({ 
              type: 'UPDATE_PATIENT_CONSULTATION', 
              payload: { 
                patientId: selectedPatient.id, 
                consultationDate: today, 
                invoiceId: invoice.id 
              } 
            });
          }
        }
      }
    });
    
    // Then, handle new procedures if any
    const validProcedures = procedures.filter(p => p.procedure && p.cost > 0);
    
    if (validProcedures.length > 0) {
      const invoiceItems = validProcedures.map(proc => ({
        id: `item-${Date.now()}-${Math.random()}`,
        description: proc.procedure,
        descriptionAr: proc.procedureAr,
        procedure: proc.procedure,
        procedureAr: proc.procedureAr,
        quantity: 1,
        unitPrice: proc.cost,
        total: proc.cost
      }));

      const paidForNewProcedures = Math.max(0, remainingPayment);
      const remainingForNewProcedures = newProceduresTotal - paidForNewProcedures;
      
      let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
      if (paidForNewProcedures >= newProceduresTotal) {
        status = 'paid';
      } else if (paidForNewProcedures > 0) {
        status = 'partial';
      }

      const newInvoiceId = `inv-${Date.now()}`;
      const newInvoice = {
        id: newInvoiceId,
        patientId: selectedPatient.id,
        patient: selectedPatient,
        doctorId: invoiceDoctorId,
        items: invoiceItems,
        subtotal: newProceduresSubtotal,
        discount: discount,
        discountType: 'fixed' as const,
        total: newProceduresTotal,
        paid: paidForNewProcedures,
        remaining: remainingForNewProcedures,
        status,
        paymentMethod,
        payments: paidForNewProcedures > 0 ? [{
          id: `pay-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          amount: paidForNewProcedures,
          method: paymentMethod,
          paidAt: nowIso,
          paidDate: today,
          beforeRemaining: newProceduresTotal,
          afterRemaining: remainingForNewProcedures,
          createdByDoctorId: state.ui.activeDoctorId,
        }] : [],
        createdAt: today
      };

      dispatch({ type: 'ADD_INVOICE', payload: newInvoice });
      
      // Check if consultation was included and paid
      const hasConsultation = validProcedures.some(proc => proc.isConsultation);
      if (hasConsultation && paidForNewProcedures > 0) {
        // Update patient consultation tracking
        dispatch({ 
          type: 'UPDATE_PATIENT_CONSULTATION', 
          payload: { 
            patientId: selectedPatient.id, 
            consultationDate: today, 
            invoiceId: newInvoiceId 
          } 
        });
      }
    }

    onSave();
  };

  return (
    <div className="space-y-4 py-4">
      {/* Loading indicator */}
      {loadingPatientData && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orchid"></div>
          <p className="text-sm text-charcoal-400 mt-2">
            {isRTL ? 'جاري تحميل بيانات المريض...' : 'Loading patient data...'}
          </p>
        </div>
      )}
      
      {/* Patient Selection - Only show if no pre-selected patient */}
      {!preSelectedPatient && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-charcoal">
            {isRTL ? 'اسم المريض' : 'Patient Name'}
          </label>
          <input
            type="text"
            placeholder={isRTL ? 'ابحث بالاسم أو رقم الهاتف...' : 'Search by name or phone...'}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedPatient(null);
            }}
            className="w-full px-4 py-3 rounded-xl border border-charcoal-200 focus:border-orchid focus:outline-none outline-none"
          />
          
          {searchQuery && !selectedPatient && (
            <div className="max-h-48 overflow-y-auto border border-charcoal-200 rounded-xl divide-y bg-white shadow-lg">
              {filteredPatients.length === 0 ? (
                <div className="p-3 text-sm text-charcoal-400 text-center">
                  {isRTL ? 'لا توجد نتائج' : 'No results found'}
                </div>
              ) : (
                filteredPatients.map(patient => (
                  <button
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient)}
                    className="w-full p-3 text-left hover:bg-orchid-50 transition-colors"
                  >
                    <p className="font-medium text-charcoal">
                      {isRTL ? patient.nameAr : patient.name}
                    </p>
                    <p className="text-sm text-charcoal-400">{patient.phone}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Selected Patient Display */}
      {selectedPatient && (
        <div className="p-3 bg-orchid-50 border border-orchid-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-charcoal">
                {isRTL ? selectedPatient.nameAr : selectedPatient.name}
              </p>
              <p className="text-sm text-charcoal-600">{selectedPatient.phone}</p>
            </div>
            {!preSelectedPatient && (
              <button
                onClick={() => {
                  setSelectedPatient(null);
                  setSearchQuery('');
                }}
                className="text-charcoal-400 hover:text-charcoal-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Treating Doctor (Assistant only) */}
      {isAssistant && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-charcoal">
            {isRTL ? 'الطبيب' : 'Doctor'}
          </label>
          <select
            value={treatingDoctorId}
            onChange={(e) => setTreatingDoctorId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-charcoal-200 focus:border-orchid focus:outline-none outline-none text-sm"
          >
            {nonAssistantDoctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {isRTL ? doctor.nameAr : doctor.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Follow-up Payment Notice - Show for all follow-up appointments */}
      {selectedPatient && effectiveBillingMode === 'follow_up' && initialProcedure && (
        <>
          {/* Case 1: Follow-up with outstanding balance for this procedure */}
          {outstandingInvoices.some(inv => 
            inv.items.some(item => item.procedure === initialProcedure)
          ) && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">ℹ️ {isRTL ? 'متابعة دفع' : 'Follow-up Payment'}</span>
                <br />
                <span className="text-xs">
                  {isRTL 
                    ? `هذا موعد متابعة لإجراء "${initialProcedureAr || initialProcedure}" السابق. الدفع سيذهب للفاتورة القديمة. يمكنك إضافة إجراءات جديدة إذا لزم الأمر.`
                    : `This is a follow-up for the previous "${initialProcedure}" procedure. Payment will go to the outstanding invoice. You can add new procedures if needed.`}
                </span>
              </p>
            </div>
          )}
          
          {/* Case 2: Follow-up but procedure is already fully paid */}
          {!outstandingInvoices.some(inv => 
            inv.items.some(item => item.procedure === initialProcedure)
          ) && (
            <div className="p-3 bg-sage-50 border border-sage-200 rounded-xl">
              <p className="text-sm text-sage-800">
                <span className="font-semibold">ℹ️ {isRTL ? 'متابعة إجراء' : 'Follow-up Visit'}</span>
                <br />
                <span className="text-xs">
                  {isRTL 
                    ? `هذا موعد متابعة لإجراء "${initialProcedureAr || initialProcedure}" السابق. الإجراء السابق مدفوع بالكامل. يمكنك إضافة إجراءات جديدة إذا لزم الأمر.`
                    : `This is a follow-up for the previous "${initialProcedure}" procedure. The previous procedure is fully paid. You can add new procedures if needed.`}
                </span>
              </p>
            </div>
          )}
        </>
      )}

      {/* Outstanding Invoices Section */}
      {selectedPatient && outstandingInvoices.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-charcoal">
              {isRTL ? 'فواتير سابقة بها رصيد متبقي' : 'Outstanding Invoices'}
            </label>
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs font-medium text-orchid hover:text-orchid-dark transition-colors"
            >
              {selectedInvoiceIds.size === outstandingInvoices.length ? (
                <>
                  <CheckSquare className="w-4 h-4" />
                  {isRTL ? 'إلغاء تحديد الكل' : 'Deselect All'}
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" />
                  {isRTL ? 'تحديد الكل' : 'Select All'}
                </>
              )}
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto border border-amber-200 rounded-xl p-3 bg-amber-50/30">
            {outstandingInvoices.map((invoice) => (
              <div
                key={invoice.id}
                onClick={() => toggleInvoiceSelection(invoice.id)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                  selectedInvoiceIds.has(invoice.id)
                    ? "border-amber bg-amber-50 shadow-sm"
                    : "border-charcoal-200 bg-white hover:border-amber-300"
                )}
              >
                <div className="pt-0.5">
                  {selectedInvoiceIds.has(invoice.id) ? (
                    <CheckSquare className="w-5 h-5 text-amber" />
                  ) : (
                    <Square className="w-5 h-5 text-charcoal-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-charcoal">
                        {invoice.items.map(item => isRTL ? item.procedureAr : item.procedure).join(', ')}
                      </p>
                      <p className="text-xs text-charcoal-400 mt-0.5">
                        {new Date(invoice.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-700">
                        {invoice.remaining.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}
                      </p>
                      <p className="text-xs text-charcoal-400">
                        {isRTL ? 'متبقي' : 'remaining'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-amber-800">
                {isRTL ? 'إجمالي المتبقي المحدد:' : 'Selected Outstanding Total:'}
              </span>
              <span className="text-lg font-bold text-amber-700">
                {selectedInvoicesTotal.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Procedures Section */}
      {/* Show procedures list only if there are procedures */}
      {procedures.length > 0 && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-charcoal">
            {isRTL ? 'الإجراءات الجديدة' : 'New Procedures'}
          </label>

          {/* Consultation Info Message */}
          {procedures.some(p => p.isConsultation) && (
            <div className="p-3 bg-orchid-50 border border-orchid-200 rounded-xl">
              <p className="text-sm text-orchid-800">
                <span className="font-semibold">ℹ️ {isRTL ? 'كشف إجباري' : 'Mandatory Consultation'}</span>
                <br />
                <span className="text-xs">
                  {isRTL 
                    ? 'الكشف مطلوب كل 3 شهور لكل مريض. هذا المريض يحتاج إلى دفع رسوم الكشف.'
                    : 'Consultation is required every 3 months for each patient. This patient needs to pay the consultation fee.'}
                </span>
              </p>
            </div>
          )}

          {procedures.map((proc) => (
            <div 
              key={proc.id} 
              className={cn(
                "flex gap-2 items-center p-2 rounded-xl transition-all",
                proc.isConsultation && "bg-orchid-50 border border-orchid-200"
              )}
            >
              <select
                value={proc.procedure}
                onChange={(e) => handleProcedureChange(proc.id, e.target.value)}
                disabled={proc.isConsultation}
                className={cn(
                  "flex-1 px-3 py-2 rounded-xl border focus:border-orchid focus:outline-none outline-none text-sm",
                  proc.isConsultation 
                    ? "border-orchid-300 bg-orchid-100 text-orchid-900 cursor-not-allowed font-semibold" 
                    : "border-charcoal-200"
                )}
              >
                <option value="" disabled>
                  {isRTL ? 'اختر إجراء' : 'Select a Procedure'}
                </option>
                {procedureOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {isRTL ? option.labelAr : option.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={proc.cost}
                onChange={(e) => {
                  const selected = procedureOptions.find(p => p.value === proc.procedure);
                  const isFlexible = selected?.isFlexible ?? false;
                  if (!isFlexible || proc.isConsultation) return;
                  const value = Number(e.target.value) || 0;
                  setProcedures(prev =>
                    prev.map(p => p.id === proc.id ? { ...p, cost: value } : p)
                  );
                }}
                disabled={proc.isConsultation || !(procedureOptions.find(p => p.value === proc.procedure)?.isFlexible)}
                className={cn(
                  "w-28 px-3 py-2 rounded-xl border focus:border-orchid focus:outline-none outline-none text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                  proc.isConsultation 
                    ? "border-orchid-300 bg-orchid-100 text-orchid-900 cursor-not-allowed font-semibold" 
                    : "disabled:bg-charcoal-50 disabled:text-charcoal-400 border-charcoal-200"
                )}
                placeholder="0"
              />
              {procedures.length > 1 && !proc.isConsultation && (
                <button
                  onClick={() => handleRemoveProcedure(proc.id)}
                  className="p-2 text-terracotta hover:bg-terracotta-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {proc.isConsultation && (
                <div className="p-2 text-orchid-600" title={isRTL ? 'إجباري' : 'Mandatory'}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
          
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAddProcedure}
            className="w-full text-orchid-dark border-orchid-dark hover:bg-orchid-800 hover:text-white hover:border-orchid-800"
          >
            <Plus className="w-4 h-4 mr-1" />
            {isRTL ? 'إضافة إجراء آخر' : 'Add Another Procedure'}
          </Button>
        </div>
      )}
      
      {/* Add Procedure Button - Show only if there are NO procedures but patient is selected */}
      {/* This handles Scenario 1: Follow-up payment only */}
      {selectedPatient && procedures.length === 0 && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAddProcedure}
          className="w-full text-orchid-dark border-orchid-dark hover:bg-orchid-800 hover:text-white hover:border-orchid-800"
        >
          <Plus className="w-4 h-4 mr-1" />
          {isRTL ? 'إضافة إجراء جديد' : 'Add New Procedure'}
        </Button>
      )}

      {/* Payment Details */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <label className="text-xs font-medium text-charcoal">
            {isRTL ? 'الإجمالي' : 'Total'}
          </label>
          <div className="px-3 py-2 rounded-xl bg-gray-100 border border-gray-200 text-sm font-semibold text-charcoal">
            {subtotal.toLocaleString()}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-charcoal">
            {isRTL ? 'الخصم' : 'Discount'}
          </label>
          <input
            type="number"
            value={discount}
            onChange={(e) => {
              const newDiscount = Number(e.target.value);
              
              // Get the treating doctor's maxDiscount setting
              const treatingDoctor = state.doctors.find(d => d.id === treatingDoctorId);
              const maxDiscountPercent = treatingDoctor?.maxDiscount ?? 10;
              const maxDiscountAmount = (subtotal * maxDiscountPercent) / 100;
              
              // Enforce maxDiscount limit
              const allowedDiscount = Math.min(newDiscount, maxDiscountAmount);
              setDiscount(allowedDiscount);
              
              // Show warning if discount was capped
              if (newDiscount > maxDiscountAmount) {
                console.warn(`Discount capped at ${maxDiscountPercent}% (${maxDiscountAmount} EGP) for this doctor`);
              }
            }}
            placeholder="0"
            className="w-full px-3 py-2 text-sm rounded-xl border border-charcoal-200 focus:border-orchid outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {(() => {
            const treatingDoctor = state.doctors.find(d => d.id === treatingDoctorId);
            const maxDiscountPercent = treatingDoctor?.maxDiscount ?? 10;
            const maxDiscountAmount = (subtotal * maxDiscountPercent) / 100;
            return (
              <p className="text-xs text-charcoal-400">
                {isRTL 
                  ? `الحد الأقصى: ${maxDiscountPercent}% (${maxDiscountAmount.toLocaleString()} ج.م)`
                  : `Max: ${maxDiscountPercent}% (${maxDiscountAmount.toLocaleString()} EGP)`}
              </p>
            );
          })()}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-charcoal">
            {isRTL ? 'المدفوع' : 'Paid'}
          </label>
          <input
            type="number"
            value={amountPaid}
            onChange={(e) => setAmountPaid(Number(e.target.value))}
            placeholder="0"
            className="w-full px-3 py-2 text-sm rounded-xl border border-charcoal-200 focus:border-orchid outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>

      {/* Payment Method */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-charcoal">
          {isRTL ? 'طريقة الدفع' : 'Payment Method'}
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setPaymentMethod('cash')}
            className={cn(
              'p-3 rounded-xl border transition-all duration-200 flex flex-col items-center gap-1',
              paymentMethod === 'cash'
                ? 'border-amber bg-amber text-white shadow-lg'
                : 'border-charcoal-200 hover:border-charcoal-300'
            )}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-xs font-medium">{isRTL ? 'نقدي' : 'Cash'}</span>
          </button>
          <button
            onClick={() => setPaymentMethod('card')}
            className={cn(
              'p-3 rounded-xl border transition-all duration-200 flex flex-col items-center gap-1',
              paymentMethod === 'card'
                ? 'border-terracotta bg-terracotta text-white shadow-lg'
                : 'border-charcoal-200 hover:border-charcoal-300'
            )}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-xs font-medium">{isRTL ? 'فودافون كاش' : 'Vodafone Cash'}</span>
          </button>
          <button
            onClick={() => setPaymentMethod('instapay')}
            className={cn(
              'p-3 rounded-xl border transition-all duration-200 flex flex-col items-center gap-1',
              paymentMethod === 'instapay'
                ? 'border-orchid-dark bg-orchid-dark text-white shadow-lg'
                : 'border-charcoal-200 hover:border-charcoal-300'
            )}
          >
            <Smartphone className="w-5 h-5" />
            <span className="text-xs font-medium">{isRTL ? 'إنستاباي' : 'InstaPay'}</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 rounded-xl bg-charcoal-50 space-y-2">
        {selectedInvoicesTotal > 0 && (
          <div className="flex justify-between text-sm pb-2 border-b border-charcoal-200">
            <span className="text-charcoal-500">{isRTL ? 'فواتير سابقة محددة:' : 'Selected Outstanding:'}</span>
            <span className="font-semibold text-amber-700">
              {selectedInvoicesTotal.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}
            </span>
          </div>
        )}
        
        {newProceduresSubtotal > 0 && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-charcoal-500">{isRTL ? 'إجراءات جديدة:' : 'New Procedures:'}</span>
              <span className="font-medium text-charcoal">
                {newProceduresSubtotal.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-500">{isRTL ? 'الخصم:' : 'Discount:'}</span>
                <span className="font-medium text-terracotta">
                  -{discount.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}
                </span>
              </div>
            )}
          </>
        )}
        
        <div className="flex justify-between text-sm pt-2 border-t border-charcoal-200">
          <span className="font-medium text-charcoal">{isRTL ? 'الإجمالي الكلي:' : 'Grand Total:'}</span>
          <span className="font-bold text-charcoal">
            {total.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-charcoal-500">{isRTL ? 'المدفوع:' : 'Paid:'}</span>
          <span className="font-medium text-sage">
            {amountPaid.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}
          </span>
        </div>
        
        <div className="flex justify-between text-base pt-2 border-t-2 border-charcoal-300">
          <span className="font-semibold text-charcoal">{isRTL ? 'المتبقي:' : 'Remaining:'}</span>
          <span className="font-bold text-amber-600 text-lg">
            {remaining.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-600"
          onClick={onClose}
        >
          {isRTL ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button
          className="flex-1 bg-orchid-dark hover:bg-orchid-800"
          onClick={handleSave}
          disabled={
            !selectedPatient ||
            (
              effectiveBillingMode !== 'follow_up' &&
              procedures.filter(p => p.procedure).length === 0 &&
              selectedInvoiceIds.size === 0
            )
          }
        >
          <FileText className="w-4 h-4 mr-2" />
          {isRTL ? 'حفظ' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

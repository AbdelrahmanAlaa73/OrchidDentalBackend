import { useState } from 'react';
import { Plus, X, Wallet, CreditCard, Smartphone, FileText } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Patient, Invoice, InvoicePayment } from '@/types';

interface ProcedureItem {
  id: string;
  procedure: string;
  procedureAr: string;
  cost: number;
  isFollowUp?: boolean;
}

interface RecordPaymentProps {
  patient: Patient;
  initialProcedure?: string;
  initialProcedureAr?: string;
  onClose: () => void;
  onSave: () => void;
}

export function RecordPayment({ patient, initialProcedure, initialProcedureAr, onClose, onSave }: RecordPaymentProps) {
  const { state, dispatch } = useApp();
  const isRTL = state.ui.language === 'ar';

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

  // Calculate total remaining balance for patient
  const getTotalRemainingBalance = () => {
    return state.invoices
      .filter(inv => inv.patientId === patient.id)
      .reduce((sum, inv) => sum + inv.remaining, 0);
  };

  // Get initial procedures (including outstanding balance if exists)
  const getInitialProcedures = (): ProcedureItem[] => {
    const totalRemaining = getTotalRemainingBalance();
    const procedures: ProcedureItem[] = [];
    
    // If there's outstanding balance, add it as first procedure
    if (totalRemaining > 0) {
      procedures.push({
        id: 'outstanding-balance',
        procedure: 'Outstanding Balance',
        procedureAr: 'رصيد متبقي',
        cost: totalRemaining,
        isFollowUp: true
      });
      
      // For follow-up with outstanding balance, don't add the initial procedure
      // Just add an empty procedure slot for optional new procedures
      procedures.push({
        id: '1',
        procedure: '',
        procedureAr: '',
        cost: 0,
        isFollowUp: false
      });
    } else {
      // No outstanding balance
      if (initialProcedure) {
        // If there's an initial procedure but no outstanding balance,
        // it means this is a new procedure (not follow-up payment)
        const pricing = state.procedurePricing.find(p => p.procedure === initialProcedure);
        procedures.push({
          id: '1',
          procedure: initialProcedure,
          procedureAr: initialProcedureAr || initialProcedure,
          cost: pricing?.basePrice || 0,
          isFollowUp: false
        });
      } else {
        // No initial procedure and no outstanding balance
        // Add empty default procedure
        procedures.push({
          id: '1',
          procedure: '',
          procedureAr: '',
          cost: 0,
          isFollowUp: false
        });
      }
    }
    
    return procedures;
  };

  const [procedures, setProcedures] = useState<ProcedureItem[]>(getInitialProcedures());
  const [discount, setDiscount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'instapay'>('cash');

  // Calculate totals
  const subtotal = procedures.reduce((sum, proc) => sum + proc.cost, 0);
  const total = subtotal - discount;
  const remaining = total - amountPaid;

  const handleAddProcedure = () => {
    // When adding a new procedure, start with empty selection
    const newProcedure: ProcedureItem = {
      id: Date.now().toString(),
      procedure: '',
      procedureAr: '',
      cost: 0,
      isFollowUp: false // New procedures are never follow-ups
    };
    setProcedures([...procedures, newProcedure]);
  };

  const handleRemoveProcedure = (id: string) => {
    // Don't allow removing the outstanding balance or if it's the only procedure
    if (id === 'outstanding-balance' || procedures.length === 1) {
      return;
    }
    setProcedures(procedures.filter(p => p.id !== id));
  };

  const handleProcedureChange = (id: string, value: string) => {
    // Don't allow changing the outstanding balance
    if (id === 'outstanding-balance') {
      return;
    }
    
    const selectedProc = procedureOptions.find(p => p.value === value);
    if (selectedProc) {
      // For new procedures, always use base price
      setProcedures(procedures.map(p => 
        p.id === id 
          ? { ...p, procedure: selectedProc.value, procedureAr: selectedProc.labelAr, cost: selectedProc.defaultCost, isFollowUp: false }
          : p
      ));
    }
  };

  const handleSave = () => {
    // Try to attribute invoice to the treating doctor (not the assistant)
    const nonOutstandingProcedure = procedures.find(p => p.id !== 'outstanding-balance');
    const doctorIdForInvoice = nonOutstandingProcedure?.doctorId || state.ui.activeDoctorId;
    const today = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();
    
    // Separate follow-up payments from new procedures
    const followUpProcedures = procedures.filter(p => p.isFollowUp);
    const newProcedures = procedures.filter(p => !p.isFollowUp);
    
    // Calculate totals for new procedures only
    const newProceduresSubtotal = newProcedures.reduce((sum, proc) => sum + proc.cost, 0);
    const newProceduresTotal = newProceduresSubtotal - discount;
    
    // Handle follow-up payment (paying remaining balance)
    if (followUpProcedures.length > 0 && amountPaid > 0) {
      let remainingPayment = amountPaid;
      
      // First, pay towards old invoices
      const invoicesWithBalance = state.invoices
        .filter(inv => inv.patientId === patient.id && inv.remaining > 0)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      invoicesWithBalance.forEach(invoice => {
        if (remainingPayment > 0) {
          const paymentForThisInvoice = Math.min(remainingPayment, invoice.remaining);
          const updatedInvoice = {
            ...invoice,
            paid: invoice.paid + paymentForThisInvoice,
            remaining: invoice.remaining - paymentForThisInvoice,
            status: (invoice.remaining - paymentForThisInvoice) === 0 
              ? 'paid' as const 
              : 'partial' as const
          };

          const paymentEntry: InvoicePayment = {
            id: `pay-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            amount: paymentForThisInvoice,
            method: paymentMethod,
            paidAt: nowIso,
            paidDate: today,
            beforeRemaining: invoice.remaining,
            afterRemaining: invoice.remaining - paymentForThisInvoice,
            createdByDoctorId: state.ui.activeDoctorId,
          };
          
          const updatedInvoiceWithPayments: Invoice = {
            ...updatedInvoice,
            paymentMethod,
            payments: [...(invoice.payments || []), paymentEntry],
          };
          
          dispatch({ type: 'UPDATE_INVOICE', payload: updatedInvoiceWithPayments });
          remainingPayment -= paymentForThisInvoice;
        }
      });
      
      // If there are new procedures, create invoice for them
      if (newProcedures.length > 0) {
        const invoiceItems = newProcedures.map(proc => ({
          id: `item-${Date.now()}-${Math.random()}`,
          description: proc.procedure,
          descriptionAr: proc.procedureAr,
          procedure: proc.procedure,
          procedureAr: proc.procedureAr,
          quantity: 1,
          unitPrice: proc.cost,
          total: proc.cost
        }));

        // Calculate how much was paid towards new procedures
        const paidForNewProcedures = Math.max(0, remainingPayment);
        const remainingForNewProcedures = newProceduresTotal - paidForNewProcedures;
        
        let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
        if (paidForNewProcedures >= newProceduresTotal) {
          status = 'paid';
        } else if (paidForNewProcedures > 0) {
          status = 'partial';
        }

        const newInvoice: Invoice = {
          id: `inv-${Date.now()}`,
          patientId: patient.id,
          patient: patient,
          doctorId: doctorIdForInvoice,
          items: invoiceItems,
          subtotal: newProceduresSubtotal,
          discount: discount,
          discountType: 'fixed',
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
            createdByDoctorId: doctorIdForInvoice,
          }] : [],
          createdAt: today
        };

        dispatch({ type: 'ADD_INVOICE', payload: newInvoice });
      }
    } else {
      // This is only new procedures (no follow-up payment)
      const invoiceItems = procedures.map(proc => ({
        id: `item-${Date.now()}-${Math.random()}`,
        description: proc.procedure,
        descriptionAr: proc.procedureAr,
        procedure: proc.procedure,
        procedureAr: proc.procedureAr,
        quantity: 1,
        unitPrice: proc.cost,
        total: proc.cost
      }));

      let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
      if (amountPaid >= total) {
        status = 'paid';
      } else if (amountPaid > 0) {
        status = 'partial';
      }

      const newInvoice: Invoice = {
        id: `inv-${Date.now()}`,
        patientId: patient.id,
        patient: patient,
        doctorId: doctorIdForInvoice,
        items: invoiceItems,
        subtotal,
        discount,
        discountType: 'fixed',
        total,
        paid: amountPaid,
        remaining,
        status,
        paymentMethod,
        payments: amountPaid > 0 ? [{
          id: `pay-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          amount: amountPaid,
          method: paymentMethod,
          paidAt: nowIso,
          paidDate: today,
          beforeRemaining: total,
          afterRemaining: remaining,
          createdByDoctorId: doctorIdForInvoice,
        }] : [],
        createdAt: today
      };

      dispatch({ type: 'ADD_INVOICE', payload: newInvoice });
    }

    onSave();
  };

  return (
    <div className="space-y-4 py-4">
      {/* Patient Info - Display Only */}
      <div className="p-3 bg-orchid-50 border border-orchid-200 rounded-xl">
        <p className="font-semibold text-charcoal">
          {isRTL ? patient.nameAr : patient.name}
        </p>
        <p className="text-sm text-charcoal-600">{patient.phone}</p>
      </div>

      {/* Procedures Section */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-charcoal">
          {isRTL ? 'الإجراءات' : 'Procedures'}
        </label>

        {procedures.map((proc) => (
            <div key={proc.id} className="flex gap-2 items-center">
              <select
                value={proc.procedure}
                onChange={(e) => handleProcedureChange(proc.id, e.target.value)}
                disabled={proc.id === 'outstanding-balance'}
                className={cn(
                  "flex-1 px-3 py-2 rounded-xl border border-charcoal-200 focus:border-orchid outline-none text-sm",
                  proc.id === 'outstanding-balance' && "bg-amber-50 border-amber-300 cursor-not-allowed font-semibold text-amber-700"
                )}
              >
                {proc.id === 'outstanding-balance' ? (
                  <option value={proc.procedure}>
                    {isRTL ? '💰 رصيد متبقي سابق' : '💰 Previous Outstanding Balance'}
                  </option>
                ) : (
                  <>
                    <option value="" disabled>
                      {isRTL ? 'اختر إجراء' : 'Select a Procedure'}
                    </option>
                    {procedureOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {isRTL ? option.labelAr : option.label}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {proc.id !== 'outstanding-balance' && (
                <input
                  type="number"
                  value={proc.cost}
                  onChange={(e) => {
                    const selected = procedureOptions.find(p => p.value === proc.procedure);
                    const isFlexible = selected?.isFlexible ?? false;
                    if (!isFlexible) return;
                    const value = Number(e.target.value) || 0;
                    setProcedures(prev =>
                      prev.map(p => p.id === proc.id ? { ...p, cost: value } : p)
                    );
                  }}
                  disabled={!(procedureOptions.find(p => p.value === proc.procedure)?.isFlexible)}
                  className="w-28 px-3 py-2 rounded-xl border border-charcoal-200 focus:border-orchid focus:outline-none outline-none text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:bg-charcoal-50 disabled:text-charcoal-400"
                  placeholder="0"
                />
              )}
              {proc.id !== 'outstanding-balance' && procedures.length > 1 && (
                <button
                  onClick={() => handleRemoveProcedure(proc.id)}
                  className="p-2 text-terracotta hover:bg-terracotta-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
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
          {isRTL ? 'إضافة إجراء' : 'Add Procedure'}
        </Button>
        
        {/* Outstanding Balance Notice */}
        {procedures.some(p => p.id === 'outstanding-balance') && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-800">
              {isRTL 
                ? '⚠️ يوجد رصيد متبقي سابق. سيتم خصم المبلغ المدفوع من الرصيد القديم أولاً ثم من الإجراءات الجديدة.'
                : '⚠️ There is a previous outstanding balance. Payment will be applied to old balance first, then to new procedures.'}
            </p>
          </div>
        )}
      </div>

      {/* Payment Details - Compact 3 columns */}
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
              
              // Get the active doctor's maxDiscount setting
              const activeDoctor = state.doctors.find(d => d.id === state.ui.activeDoctorId);
              const maxDiscountPercent = activeDoctor?.maxDiscount ?? 10;
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
            const activeDoctor = state.doctors.find(d => d.id === state.ui.activeDoctorId);
            const maxDiscountPercent = activeDoctor?.maxDiscount ?? 10;
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

      {/* Compact Summary */}
      <div className="p-3 rounded-xl bg-charcoal-50 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-charcoal-500">{isRTL ? 'المجموع:' : 'Total:'}</span>
          <span className="font-semibold text-charcoal">
            {total.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-charcoal-500">{isRTL ? 'المدفوع:' : 'Paid:'}</span>
          <span className="font-medium text-sage">
            {amountPaid.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}
          </span>
        </div>
        <div className="flex justify-between text-xs pt-1.5 border-t border-charcoal-200">
          <span className="text-charcoal-500">{isRTL ? 'المتبقي:' : 'Remaining:'}</span>
          <span className="font-bold text-amber">
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
          disabled={procedures.length === 0}
        >
          <FileText className="w-4 h-4 mr-2" />
          {isRTL ? 'حفظ' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

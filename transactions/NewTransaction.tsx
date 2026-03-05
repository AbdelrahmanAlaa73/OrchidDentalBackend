import { useState } from 'react';
import { 
  DollarSign, 
  Search, 
  User, 
  FileText,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  X,
  CheckCircle
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NewTransactionProps {
  isOpen: boolean;
  onClose: () => void;
  prefillData?: {
    patientId?: string;
    doctorId?: string;
    procedure?: string;
  };
}

const procedures = [
  { id: 'check-up', name: 'Check-up', nameAr: 'فحص', price: 200 },
  { id: 'cleaning', name: 'Cleaning', nameAr: 'تنظيف', price: 300 },
  { id: 'filling', name: 'Filling', nameAr: 'حشوة', price: 400 },
  { id: 'root-canal', name: 'Root Canal', nameAr: 'علاج جذور', price: 2500 },
  { id: 'crown', name: 'Crown', nameAr: 'تاج', price: 1500 },
  { id: 'extraction', name: 'Extraction', nameAr: 'خلع', price: 500 },
  { id: 'implant', name: 'Implant', nameAr: 'زراعة', price: 8000 },
  { id: 'braces', name: 'Braces', nameAr: 'تقويم', price: 15000 },
];

export function NewTransaction({ isOpen, onClose, prefillData }: NewTransactionProps) {
  const { state, t, dispatch } = useApp();
  const { patients, doctors, activeDoctor } = state;
  const isRTL = state.ui.language === 'ar';

  const [selectedPatient, setSelectedPatient] = useState<string>(prefillData?.patientId || '');
  const [selectedDoctor, setSelectedDoctor] = useState<string>(prefillData?.doctorId || activeDoctor.id);
  const [selectedProcedure, setSelectedProcedure] = useState<string>(prefillData?.procedure || '');
  const [discount, setDiscount] = useState<string>('');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');

  // Calculate totals
  const procedurePrice = procedures.find(p => p.id === selectedProcedure)?.price || 0;
  const discountAmount = parseFloat(discount) || 0;
  const total = Math.max(0, procedurePrice - discountAmount);
  const paid = parseFloat(amountPaid) || 0;
  const remaining = Math.max(0, total - paid);

  const handleSave = () => {
    // Create new invoice
    const patient = patients.find(p => p.id === selectedPatient);
    const doctor = doctors.find(d => d.id === selectedDoctor);
    const procedure = procedures.find(p => p.id === selectedProcedure);

    if (patient && doctor && procedure) {
      const today = new Date().toISOString().split('T')[0];
      const nowIso = new Date().toISOString();
      const mappedMethod = (paymentMethod === 'transfer' ? 'instapay' : paymentMethod) as 'cash' | 'card' | 'instapay';
      const newInvoice = {
        id: `inv-${Date.now()}`,
        patientId: patient.id,
        patient,
        doctorId: doctor.id,
        items: [{
          id: `item-${Date.now()}`,
          description: procedure.name,
          descriptionAr: procedure.nameAr,
          procedure: procedure.name,
          procedureAr: procedure.nameAr,
          quantity: 1,
          unitPrice: procedure.price,
          total: procedure.price
        }],
        subtotal: procedure.price,
        discount: discountAmount,
        discountType: 'fixed' as const,
        total,
        paid,
        remaining,
        status: remaining === 0 ? 'paid' as const : paid > 0 ? 'partial' as const : 'unpaid' as const,
        paymentMethod: paid > 0 ? mappedMethod : undefined,
        payments: paid > 0 ? [{
          id: `pay-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          amount: paid,
          method: mappedMethod,
          paidAt: nowIso,
          paidDate: today,
          beforeRemaining: total,
          afterRemaining: remaining,
          createdByDoctorId: state.ui.activeDoctorId,
        }] : [],
        createdAt: today
      };

      dispatch({ type: 'ADD_INVOICE', payload: newInvoice });
      onClose();
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
    p.nameAr.includes(patientSearchQuery) ||
    p.phone.includes(patientSearchQuery)
  );

  const selectedPatientData = patients.find(p => p.id === selectedPatient);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-orchid" />
            {isRTL ? 'معاملة جديدة' : 'New Transaction'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Patient Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-charcoal">{isRTL ? 'المريض' : 'Patient'}</label>
            {selectedPatientData ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-orchid-50 border border-orchid-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orchid flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-charcoal">
                      {isRTL ? selectedPatientData.nameAr : selectedPatientData.name}
                    </p>
                    <p className="text-sm text-charcoal-400">{selectedPatientData.phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedPatient('');
                    setShowPatientSearch(true);
                  }}
                  className="p-2 rounded-lg hover:bg-orchid-100 transition-colors"
                >
                  <X className="w-4 h-4 text-orchid" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400" />
                <Input
                  type="text"
                  placeholder={isRTL ? 'البحث عن مريض...' : 'Search for patient...'}
                  value={patientSearchQuery}
                  onChange={(e) => {
                    setPatientSearchQuery(e.target.value);
                    setShowPatientSearch(true);
                  }}
                  className="pl-12"
                />
                
                {showPatientSearch && patientSearchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-ambient-lg border border-charcoal-100 z-50 max-h-60 overflow-y-auto">
                    {filteredPatients.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => {
                          setSelectedPatient(patient.id);
                          setShowPatientSearch(false);
                          setPatientSearchQuery('');
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-charcoal-50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-charcoal-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-charcoal-400" />
                        </div>
                        <div>
                          <p className="font-medium text-charcoal text-sm">
                            {isRTL ? patient.nameAr : patient.name}
                          </p>
                          <p className="text-xs text-charcoal-400">{patient.phone}</p>
                        </div>
                      </button>
                    ))}
                    {filteredPatients.length === 0 && (
                      <p className="p-4 text-center text-charcoal-400 text-sm">
                        {isRTL ? 'لا يوجد مرضى' : 'No patients found'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Doctor Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-charcoal">{isRTL ? 'الطبيب' : 'Doctor'}</label>
            <div className="grid grid-cols-2 gap-2">
              {doctors.map((doctor) => (
                <button
                  key={doctor.id}
                  onClick={() => setSelectedDoctor(doctor.id)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300',
                    selectedDoctor === doctor.id
                      ? 'border-orchid bg-orchid-50'
                      : 'border-charcoal-100 hover:border-orchid/50'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                    doctor.color === 'charcoal' && 'bg-charcoal text-white',
                    doctor.color === 'orchid' && 'bg-orchid text-white',
                    doctor.color === 'emerald' && 'bg-emerald text-white',
                    doctor.color === 'amber' && 'bg-amber text-white',
                  )}>
                    {doctor.name.charAt(4)}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-charcoal text-sm">{doctor.name}</p>
                    <p className="text-xs text-charcoal-400">{doctor.specialty}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Procedure Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-charcoal">{isRTL ? 'الإجراء' : 'Procedure'}</label>
            <div className="grid grid-cols-2 gap-2">
              {procedures.map((procedure) => (
                <button
                  key={procedure.id}
                  onClick={() => setSelectedProcedure(procedure.id)}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-300',
                    selectedProcedure === procedure.id
                      ? 'border-orchid bg-orchid-50'
                      : 'border-charcoal-100 hover:border-orchid/50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-charcoal-400" />
                    <span className="text-sm text-charcoal">
                      {isRTL ? procedure.nameAr : procedure.name}
                    </span>
                  </div>
                  <span className="font-semibold text-orchid text-sm">{procedure.price.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Discount & Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-charcoal">{t('invoice.discount')}</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-charcoal">{isRTL ? 'المبلغ المدفوع' : 'Amount Paid'}</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
                <Input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          {parseFloat(amountPaid) > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-charcoal">{isRTL ? 'طريقة الدفع' : 'Payment Method'}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-300',
                    paymentMethod === 'cash'
                      ? 'border-sage bg-sage-50 text-sage'
                      : 'border-charcoal-100 hover:border-sage/50'
                  )}
                >
                  <Banknote className="w-4 h-4" />
                  <span className="text-sm">{isRTL ? 'نقدي' : 'Cash'}</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-300',
                    paymentMethod === 'card'
                      ? 'border-orchid bg-orchid-50 text-orchid'
                      : 'border-charcoal-100 hover:border-orchid/50'
                  )}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm">{isRTL ? 'بطاقة' : 'Card'}</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('transfer')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-300',
                    paymentMethod === 'transfer'
                      ? 'border-amber bg-amber-50 text-amber'
                      : 'border-charcoal-100 hover:border-amber/50'
                  )}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span className="text-sm">{isRTL ? 'تحويل' : 'Transfer'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="p-4 rounded-xl bg-charcoal-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-charcoal-500">{isRTL ? 'المجموع' : 'Total'}</span>
              <span className="font-semibold text-charcoal">{total.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-charcoal-500">{isRTL ? 'المدفوع' : 'Paid'}</span>
              <span className="font-semibold text-sage">{paid.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-charcoal-200">
              <span className="text-sm font-medium text-charcoal">{isRTL ? 'المتبقي' : 'Remaining'}</span>
              <span className={cn(
                'font-bold text-lg',
                remaining > 0 ? 'text-terracotta' : 'text-sage'
              )}>
                {remaining.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              {t('common.cancel')}
            </Button>
            <Button
              className="flex-1 bg-orchid hover:bg-orchid-dark"
              onClick={handleSave}
              disabled={!selectedPatient || !selectedProcedure}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isRTL ? 'حفظ المعاملة' : 'Save Transaction'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

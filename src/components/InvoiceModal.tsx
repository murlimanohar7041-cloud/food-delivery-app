import { FileText, Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Order } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

interface InvoiceModalProps {
  show: boolean;
  onClose: () => void;
  order: Order;
}

export default function InvoiceModal({ show, onClose, order }: InvoiceModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const displayOrderId = order?.id || '';

  const handleDownloadInvoice = async () => {
    const element = document.getElementById('invoice-content');
    if (!element) return;
    
    setIsDownloading(true);
    const toastId = toast.loading('Generating Official Tax Invoice...');
    
    try {
      // 1. Handle Dark Mode for clean print
      const wasDark = document.documentElement.classList.contains('dark');
      if (wasDark) {
        document.documentElement.classList.remove('dark');
      }
      
      // 2. Prepare element for capture
      const originalPadding = element.style.padding;
      const originalMinHeight = element.style.minHeight;
      const originalWidth = element.style.width;
      
      element.style.padding = '40px';
      element.style.minHeight = '1000px'; 
      element.style.width = '800px'; 
      
      // 3. Delay to ensure font and styles are ready
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 4. Capture Canvas
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          // 1. Inject a style block to override oklch variables with hex fallbacks
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            :root {
              --color-white: #ffffff !important;
              --color-black: #000000 !important;
              --color-gray-50: #f9fafb !important;
              --color-gray-100: #f3f4f6 !important;
              --color-gray-200: #e5e7eb !important;
              --color-gray-300: #d1d5db !important;
              --color-gray-400: #9ca3af !important;
              --color-gray-500: #6b7280 !important;
              --color-gray-600: #4b5563 !important;
              --color-gray-700: #374151 !important;
              --color-gray-800: #1f2937 !important;
              --color-gray-900: #111827 !important;
              --color-red-500: #ef4444 !important;
              --color-red-600: #dc2626 !important;
              --color-green-500: #22c55e !important;
              --color-blue-500: #3b82f6 !important;
            }
            * {
              color-scheme: light !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          `;
          clonedDoc.head.appendChild(style);

          // 3. Force text visibility and colors in clone
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;

            // Strip problematic variables
            el.style.setProperty('--tw-shadow', 'none');
            el.style.setProperty('--tw-ring-color', 'transparent');
            el.style.setProperty('--tw-gradient-from', 'transparent');
            el.style.setProperty('--tw-gradient-to', 'transparent');

            // Find any remaining oklch properties and force them to fallbacks
            const computed = window.getComputedStyle(el);
            ['color', 'backgroundColor', 'borderColor'].forEach(prop => {
              const val = (computed as any)[prop];
              if (val && val.includes('oklch')) {
                if (prop === 'color') el.style.color = '#111827';
                if (prop === 'backgroundColor' && !el.classList.contains('bg-white')) {
                   // Keep transparent or set simple gray if it was a background
                   if (val.includes('0.05') || val.includes('5%')) el.style.backgroundColor = '#f9fafb';
                   else if (val.includes('0.1') || val.includes('10%')) el.style.backgroundColor = '#f3f4f6';
                }
                if (prop === 'borderColor') el.style.borderColor = '#e5e7eb';
              }
            });
          }
        }
      });
      
      // 5. Restore original states
      element.style.padding = originalPadding;
      element.style.minHeight = originalMinHeight;
      element.style.width = originalWidth;
      
      if (wasDark) {
        document.documentElement.classList.add('dark');
      }

      // 6. Build PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const fileName = `Nexra_Invoice_${displayOrderId}.pdf`;
      pdf.save(fileName);
      
      toast.success('Tax Invoice saved successfully!', { id: toastId });
      
      // Add a helpful note for iframe preview users
      if (window.self !== window.top) {
        setTimeout(() => {
          toast('If the download didn\'t start automatically, please open the app in a new tab (restrictions of the preview).', { 
            icon: 'ℹ️',
            duration: 5000 
          });
        }, 1000);
      }

    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to generate Tax Invoice. Please try again.', { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {show && order && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white dark:bg-[#0a0a0a] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-white/10">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-6 h-6 text-[#E23744]" />
                  Invoice
                </h2>
                <p className="text-sm text-gray-500 mt-1">Order #{displayOrderId}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Invoice Content */}
            <div 
              className="p-8 overflow-y-auto bg-white flex-1" 
              id="invoice-content"
              style={{ color: '#000000', backgroundColor: '#ffffff' }}
            >
              {/* Tax Invoice Header */}
              <div className="text-center mb-8 border-b-2 border-gray-100 pb-4">
                <h1 className="text-xl font-bold uppercase tracking-[0.2em] text-gray-800">Tax Invoice / Bill of Supply</h1>
              </div>

              <div className="flex justify-between items-start mb-10">
                <div className="flex flex-col gap-1">
                  <h3 className="text-3xl font-black italic tracking-tighter" style={{ color: '#E23744' }}>Nexra</h3>
                  <p className="text-[10px] font-bold text-gray-400">nexra.com</p>
                </div>
                <div className="text-right">
                  <div className="inline-flex px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest mb-3" style={{ backgroundColor: '#f0f0f0', color: '#333333', border: '1px solid #ddd' }}>
                    {order.paymentMethod === 'cod' ? 'COD - UNPAID' : 'PREPAID - SECURE'}
                  </div>
                  <p className="text-[11px] font-bold text-gray-500">Invoice No: <span className="text-gray-900">#NEX-{displayOrderId.slice(-6)}</span></p>
                  <p className="text-[11px] font-bold text-gray-500">Order Date: <span className="text-gray-900">{new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-10 mb-10 text-[11px] leading-relaxed">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="font-black text-gray-400 uppercase mb-2 tracking-widest text-[9px]">Sold By:</p>
                  <p className="font-bold text-gray-900 text-sm">Nexra Retail India Pvt Ltd</p>
                  <p className="text-gray-600 mt-1">Ground Floor, Tower B, Nexra Tech Park,</p>
                  <p className="text-gray-600">Electronic City Phase 1, Bangalore,</p>
                  <p className="text-gray-600">Karnataka - 560100, India</p>
                  <p className="text-gray-900 font-bold mt-2">GSTIN: <span className="font-mono">29AAACN1234A1Z5</span></p>
                  <p className="text-gray-900 font-bold">PAN: <span className="font-mono">ABCDE1234F</span></p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="font-black text-gray-400 uppercase mb-2 tracking-widest text-[9px]">Shipping Address:</p>
                  <p className="font-bold text-gray-900 text-sm">{order.address.name || `${order.address.firstName} ${order.address.lastName}`}</p>
                  <p className="text-gray-600 mt-1">{order.address.flat ? `${order.address.flat}, ` : ''}{order.address.address}</p>
                  <p className="text-gray-600">{order.address.city} - {order.address.zipCode}</p>
                  <p className="text-gray-600">India</p>
                  {order.address.phone && <p className="text-gray-900 font-bold mt-2">Phone: {order.address.phone}</p>}
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden mb-8" style={{ borderColor: '#e0e0e0' }}>
                <table className="w-full text-left border-collapse">
                  <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eeeeee' }}>
                    <tr>
                      <th className="py-4 px-5 text-[10px] font-black uppercase tracking-widest" style={{ color: '#666666' }}>S.No</th>
                      <th className="py-4 px-5 text-[10px] font-black uppercase tracking-widest" style={{ color: '#666666' }}>Description</th>
                      <th className="py-4 px-5 text-[10px] font-black uppercase tracking-widest text-center" style={{ color: '#666666' }}>Qty</th>
                      <th className="py-4 px-5 text-[10px] font-black uppercase tracking-widest text-right" style={{ color: '#666666' }}>Net Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td className="py-4 px-5 text-[11px] font-bold text-gray-500">{idx + 1}</td>
                        <td className="py-4 px-5">
                          <p className="text-[12px] font-bold" style={{ color: '#111827' }}>{item.name}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">HSN: 210690</p>
                        </td>
                        <td className="py-4 px-5 text-[11px] font-bold text-center" style={{ color: '#6b7280' }}>{item.quantity}</td>
                        <td className="py-4 px-5 text-[12px] font-black text-right" style={{ color: '#111827' }}>₹{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-start">
                <div className="max-w-[300px]">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#666666' }}>Important Notes:</p>
                  <ul className="text-[9px] text-gray-400 space-y-1 list-disc pl-4 leading-relaxed">
                    <li>Total includes 5% GST (CGST: 2.5%, SGST: 2.5%) for all applicable items.</li>
                    <li>Returns must be requested within 30 days of delivery.</li>
                    <li>This is a computer generated invoice and does not require a physical signature under Information Technology Act, 2000.</li>
                  </ul>
                </div>
                <div className="w-full max-w-[220px]">
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-[11px] font-bold text-gray-500">
                      <span>Items Subtotal</span>
                      <span>₹{(order.total - 49).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-gray-500">
                      <span>Delivery & Packing</span>
                      <span>₹49.00</span>
                    </div>
                    <div className="pt-3 flex justify-between items-center text-lg font-black" style={{ borderTop: '2px solid #111827', color: '#111827' }}>
                      <span className="text-[12px] uppercase tracking-widest">Total Pay</span>
                      <span>₹{order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Authorised Signature Section */}
                  <div className="mt-8 text-center signature-container">
                    <div className="mb-2 flex justify-center">
                      <svg viewBox="0 0 400 150" className="w-48 h-20 opacity-90" preserveAspectRatio="xMidYMid meet">
                        {/* M */}
                        <path d="M 140 50 C 130 40, 130 55, 135 100 C 135 80, 145 45, 155 45 C 165 45, 162 90, 165 95 C 165 85, 172 55, 180 55 C 186 55, 185 90, 185 95" fill="none" stroke="#1d1e6e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                        {/* u */}
                        <path d="M 185 95 C 190 100, 192 75, 198 75 C 198 90, 205 100, 208 95" fill="none" stroke="#1d1e6e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                        {/* r */}
                        <path d="M 208 95 C 212 80, 218 68, 224 68 C 228 68, 226 72, 224 75 C 224 90, 230 100, 235 95" fill="none" stroke="#1d1e6e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                        {/* l */}
                        <path d="M 235 95 C 240 85, 255 30, 260 30 C 265 30, 255 90, 260 95" fill="none" stroke="#1d1e6e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                        {/* i */}
                        <path d="M 260 95 C 265 100, 270 75, 275 75 C 272 90, 278 95, 284 92" fill="none" stroke="#1d1e6e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                        {/* i dot */}
                        <circle cx="282" cy="55" r="3.5" fill="#1d1e6e"/>
                        {/* Underline Swoosh */}
                        <path d="M 270 130 C 180 145, 30 145, 20 135 C 10 125, 60 120, 100 118 C 200 113, 300 115, 380 118" fill="none" stroke="#1d1e6e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div style={{ height: '1.5px', width: '100%', backgroundColor: '#000000', margin: '4px auto' }}></div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: '#111827' }}>
                      Murli Manohar Kumar
                    </p>
                    <p className="text-[8px] font-bold text-gray-500 mt-0.5 lowercase tracking-wider">
                      murlimanohar7041@gmail.com
                    </p>
                    <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                      Authorised Signatory
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer / Actions - FIXED AT BOTTOM */}
            <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#141414] mt-auto flex gap-3 z-[101] shrink-0">
              <button 
                onClick={handleDownloadInvoice}
                disabled={isDownloading}
                className="flex-1 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className={`w-5 h-5 ${isDownloading ? 'animate-bounce text-blue-500' : 'text-[#E23744]'}`} />
                {isDownloading ? 'Generating Tax Invoice...' : 'Download Official PDF'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

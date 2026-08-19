import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Phone, 
  MessageSquare, 
  Bike, 
  Store, 
  User as UserIcon, 
  Check, 
  CheckCheck, 
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Order, ChatMessage, UserRole } from '../types';
import { toast } from 'react-hot-toast';

interface OrderChatModalProps {
  order: Order;
  currentUserRole?: UserRole;
  currentUserId?: string;
  currentUserName?: string;
  onClose: () => void;
  onInitiateCall?: (target: 'rider' | 'restaurant' | 'customer', phone: string, name: string) => void;
}

export default function OrderChatModal({
  order,
  currentUserRole = 'customer',
  currentUserId = auth.currentUser?.uid || 'user-anon',
  currentUserName = auth.currentUser?.displayName || 'Customer',
  onClose,
  onInitiateCall
}: OrderChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick preset chips depending on who is chatting
  const quickReplies = currentUserRole === 'customer' 
    ? [
        "Please leave it at the doorstep 🚪",
        "Call me once you arrive 📞",
        "Add extra tissues & cutlery please 🍽️",
        "What's your current location? 📍",
        "Gate passcode is #402"
      ]
    : currentUserRole === 'rider'
    ? [
        "I have picked up your food 🛵",
        "On the way, ETA ~5 mins ⏱️",
        "I have reached your building entrance 📍",
        "Please confirm house/flat number 🏢",
        "Delivered at security desk ✨"
      ]
    : [
        "Your food is being freshly prepared 👨‍🍳",
        "Packed and ready for rider pickup 📦",
        "Order confirmed, thank you! 🙏"
      ];

  // Subscribe to real-time chat messages
  useEffect(() => {
    if (!order?.id) return;

    const messagesRef = collection(db, 'orders', order.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as ChatMessage);
      });
      setMessages(fetched);
    }, (error) => {
      console.warn('Chat messages sync notice:', error.message);
    });

    return () => unsubscribe();
  }, [order?.id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !order?.id) return;

    setIsSending(true);
    try {
      const messagesRef = collection(db, 'orders', order.id, 'messages');
      const newMsg = {
        orderId: order.id,
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: currentUserRole,
        text: text,
        createdAt: new Date().toISOString(),
        read: false
      };

      await addDoc(messagesRef, newMsg);
      setInputText('');
    } catch (err: any) {
      console.error('Error sending chat message:', err);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Determine chat header details
  const otherPartyName = currentUserRole === 'customer'
    ? (order.deliveryPartner?.name || order.restaurantName || 'Delivery Partner & Store')
    : (order.address?.firstName ? `${order.address.firstName} ${order.address.lastName || ''}`.trim() : 'Customer');

  const otherPartyPhone = currentUserRole === 'customer'
    ? (order.deliveryPartner?.phone || order.restaurantPhone || '+91 98765 43210')
    : (order.address?.phone || '+91 98765 43210');

  const otherPartyRoleTitle = currentUserRole === 'customer'
    ? (order.deliveryPartner ? 'Delivery Hero' : 'Restaurant Support')
    : 'Order Customer';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#141414] rounded-3xl shadow-2xl border border-black/10 dark:border-white/10 flex flex-col h-[600px] max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gray-50/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md border-b border-black/5 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#E23744] to-[#FF8C00] flex items-center justify-center text-white font-bold shadow-md shadow-red-500/20">
                {currentUserRole === 'customer' ? <Bike className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#141414] rounded-full"></span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-gray-900 dark:text-white truncate">
                  {otherPartyName}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 dark:bg-red-500/20 text-[#E23744] shrink-0">
                  {otherPartyRoleTitle}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                Order #{order.id.slice(-6).toUpperCase()} • Active Chat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onInitiateCall && otherPartyPhone && (
              <button
                type="button"
                onClick={() => onInitiateCall(
                  currentUserRole === 'customer' ? 'rider' : 'customer',
                  otherPartyPhone,
                  otherPartyName
                )}
                className="p-2.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                title={`Call ${otherPartyName}`}
              >
                <Phone className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-gradient-to-b from-transparent via-black/[0.01] to-black/[0.03] dark:from-transparent dark:to-white/[0.01]">
          {/* Order Info Badge */}
          <div className="flex justify-center my-2">
            <div className="px-3 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Real-time encrypted order chat connected</span>
            </div>
          </div>

          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-gray-600 dark:text-gray-300">No messages yet</p>
              <p className="text-xs max-w-xs text-gray-500 dark:text-gray-400">
                Send a quick message or select a preset below to communicate with {otherPartyName}.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              const timeStr = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

              return (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  {!isMe && (
                    <span className="text-[10px] font-bold text-gray-400 mb-1 ml-1">
                      {msg.senderName} ({msg.senderRole})
                    </span>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                      isMe
                        ? 'bg-gradient-to-tr from-[#E23744] to-[#FF5E5E] text-white rounded-br-none'
                        : 'bg-gray-100 dark:bg-[#20222a] text-gray-900 dark:text-white rounded-bl-none border border-black/5 dark:border-white/5'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${isMe ? 'text-white/80' : 'text-gray-400'}`}>
                      <span>{timeStr}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-white/90" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-gray-50/50 dark:bg-[#181818]/50 border-t border-black/5 dark:border-white/5 overflow-x-auto no-scrollbar flex items-center gap-2">
          {quickReplies.map((reply, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(reply)}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-[#242424] hover:bg-red-50 dark:hover:bg-red-500/10 border border-black/5 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-[#E23744] dark:hover:text-[#FF5E5E] transition-all whitespace-nowrap active:scale-95 shadow-2xs"
            >
              {reply}
            </button>
          ))}
        </div>

        {/* Message Input Box */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="p-3 sm:p-4 bg-white dark:bg-[#141414] border-t border-black/5 dark:border-white/10 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${otherPartyName}...`}
            className="flex-1 px-4 py-3 rounded-2xl bg-gray-100 dark:bg-[#20222a] border border-transparent focus:border-[#E23744] text-sm text-gray-900 dark:text-white outline-none transition-all placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-3 bg-gradient-to-r from-[#E23744] to-[#FF5E5E] text-white rounded-2xl hover:shadow-lg hover:shadow-red-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

      </div>
    </div>
  );
}

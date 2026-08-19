export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  image?: string;
  category?: string;
  description?: string;
}

export interface Address {
  firstName?: string;
  lastName?: string;
  email?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  name?: string;
  phone?: string;
  flat?: string;
  area?: string;
  pincode?: string;
}

export interface LocationCoords {
  lat: number;
  lng: number;
  address?: string;
  accuracy?: number;
}

export interface RestaurantLocation extends LocationCoords {
  name?: string;
  phone?: string;
}

export type UserRole = 'customer' | 'admin' | 'rider' | 'restaurant';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  address?: string;
  city?: string;
  pincode?: string;
  location?: LocationCoords;
  vehicleNumber?: string;
  vehicleType?: 'bike' | 'scooter' | 'ev';
  createdAt?: string;
  blocked?: boolean;
  totalOrders?: number;
}

export interface DeliveryPartner {
  id?: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  vehicleType: 'bike' | 'scooter' | 'ev';
  rating: number;
  avatar?: string;
  status?: 'active' | 'busy' | 'offline';
  isActive?: boolean;
  currentOrderId?: string;
  location?: DeliveryLocation;
  totalDeliveries?: number;
  createdAt?: string;
}

export interface DeliveryLocation {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  updatedAt?: string;
}

export interface LiveLocation {
  orderId: string;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  updatedAt: string;
  status?: 'active' | 'completed' | 'cancelled';
}

export interface ETAInfo {
  text: string;
  minutes: number;
  distanceKm: number;
}

export type OrderStatus = 
  | 'Pending' 
  | 'Restaurant Accepted' 
  | 'Preparing' 
  | 'Ready for Pickup' 
  | 'Out for Delivery' 
  | 'Delivered' 
  | 'Cancelled';

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'rider' | 'restaurant';
  text: string;
  createdAt: string;
  read?: boolean;
}

export interface Order {
  id: string;
  userId?: string;
  userEmail?: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  date: string;
  address: Address;
  paymentMethod: string;
  paymentStatus?: 'paid' | 'pending' | 'failed' | 'cod';
  paymentGateway?: 'razorpay' | 'stripe' | 'cod' | 'upi_direct';
  paymentTransactionId?: string;
  restaurantName?: string;
  restaurantPhone?: string;
  customerLocation?: LocationCoords;
  restaurantLocation?: LocationCoords & { name?: string; phone?: string };
  deliveryLocation?: DeliveryLocation;
  deliveryPartner?: DeliveryPartner;
  eta?: ETAInfo;
  deliveryBoyId?: string;
  statusHistory?: OrderStatusHistoryEntry[];
  cancelReason?: string;
  notes?: string;
}

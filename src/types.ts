export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  image?: string;
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
}

export interface RestaurantLocation extends LocationCoords {
  name?: string;
}

export type UserRole = 'customer' | 'admin' | 'rider';

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
  updatedAt?: string;
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
  restaurantName?: string;
  customerLocation?: LocationCoords;
  restaurantLocation?: LocationCoords & { name?: string };
  deliveryLocation?: DeliveryLocation;
  deliveryPartner?: DeliveryPartner;
  eta?: ETAInfo;
  deliveryBoyId?: string;
}

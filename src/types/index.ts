export interface Product {
  id: string;
  _id?: string;
  name: string;
  subtitle?: string;
  category: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  rating: number;
  reviewsCount: number;
  image?: string;
  images: string[];
  colors: { name: string; hex: string }[];
  sizes: string[];
  description: string;
  details: string[];
  material: string;
  inStock: boolean;
  stockCount: number;
  stock?: number;
  quantity?: number;
  status?: string;
  badge?: "NEW" | "HOT" | "BEST SELLER" | "SALE" | "LIMITED";
  isFeatured?: boolean;
  isNewArrival?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  itemCount: number;
  description: string;
}

export interface CartItem {
  id: string; // unique item id (product.id + size + color)
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: { name: string; hex: string };
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  role?: string;
  isAdmin?: boolean;
  address?: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
  size: string;
  color: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: "Processing" | "Shipped" | "Delivered" | "Cancelled";
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: {
    fullName: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };
  paymentMethod: string;
}

export interface Review {
  id: string;
  author?: string;
  authorName?: string;
  authorEmail?: string;
  authorAvatar?: string;
  avatar?: string;
  title?: string;
  rating: number;
  date: string;
  comment: string;
  verified?: boolean;
  isVerifiedBuyer?: boolean;
  recommended?: boolean;
}


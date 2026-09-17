export type Tier = "SILVER" | "GOLD" | "BLACK";

export type Customer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  birthday: string | null;
  tier: Tier;
  pointsBalance: number;
  lifetimePoints: number;
  creditFils: number;
  referralCode: string;
  marketingOptIn: boolean;
  favouriteBarberId: string | null;
  nextTier: { tier: Tier; pointsNeeded: number; threshold: number } | null;
  memberSince: string;
};

export type Service = {
  id: string;
  slug: string;
  name: string;
  description: string;
  durationMin: number;
  priceFils: number;
  imageUrl: string;
  popular: boolean;
};

export type Category = { id: string; slug: string; name: string; services: Service[] };

export type Branch = {
  id: string;
  slug: string;
  name: string;
  area: string;
  address: string;
  phone: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  openingHours: { weekday: number; open: string; close: string }[];
};

export type Barber = {
  id: string;
  name: string;
  title: string;
  bio: string;
  photoUrl: string;
  rating: number;
  branchId: string;
  serviceIds: string[];
};

export type Policy = {
  depositPercent: number;
  cancellationHours: number;
  bookingWindowDays: number;
  pointsPerAed: number;
  redeemBlockPoints: number;
  redeemBlockFils: number;
  goldThreshold: number;
  blackThreshold: number;
  paymentsMode: "stripe" | "demo";
};

export type Catalog = { categories: Category[]; branches: Branch[]; barbers: Barber[]; policy: Policy };

export type NewsSummary = { id: string; title: string; summary: string; imageUrl: string; tag: string; pinned: boolean; publishedAt: string };
export type NewsPost = NewsSummary & { body: string };

export type Slot = { time: string; startsAt: string; barberIds: string[] };

export type AppointmentStatus = "PENDING_PAYMENT" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export type Appointment = {
  id: string;
  reference: string;
  status: AppointmentStatus;
  paymentStatus: "UNPAID" | "DEPOSIT_PAID" | "PAID" | "REFUNDED";
  startsAt: string;
  endsAt: string;
  branch: Pick<Branch, "id" | "name" | "area" | "address" | "phone" | "latitude" | "longitude">;
  barber: Pick<Barber, "id" | "name" | "title" | "photoUrl">;
  items: { serviceId: string; name: string; priceFils: number; durationMin: number }[];
  notes: string | null;
  subtotalFils: number;
  depositFils: number;
  creditUsedFils: number;
  paidFils: number;
  balanceDueFils: number;
  canCancel: boolean;
  canReschedule: boolean;
  lateCancellation: boolean;
  cancellationHours: number;
  holdExpiresAt: string | null;
};

export type Checkout = { paymentId: string; mode: "stripe" | "demo"; checkoutUrl: string | null; amountFils: number };

export type WalletActivity = { id: string; kind: "points" | "credit"; amount: number; reason: string; createdAt: string };
export type GiftCardSent = { id: string; code: string; amountFils: number; recipientName: string; redeemed: boolean; createdAt: string };

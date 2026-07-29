export type { User, UserRole, UpdateUserDto } from './user';
export type {
  Client,
  CreateClientDto,
  UpdateClientDto,
} from './client';
export type {
  Appointment,
  AppointmentStatus,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './appointment'; // ✅ Suppression de PaymentMethod (déplacé)
export type {
  Service,
  ServiceCategory,
  CreateServiceDto,
  UpdateServiceDto,
} from './service';
export type { Review, CreateReviewDto } from './review';
export type { GalleryItem, CreateGalleryItemDto } from './gallery';
export type { SalonSettings, BusinessHours, ColorPreset } from './settings';
export type {
  ChartDataPoint,
  ServicePopularity,
  DashboardStats,
  RevenueByMonth,
  AppointmentsByMonth,
  CancellationDataPoint,
} from './stats';
export type {
  Reminder,
  ReminderSettings,
  ReminderRecipients,
  ReminderDelay,
  CreateReminderDto,
} from './reminder';
export type {
  ServiceCategoryConfig,
  TimeSlotConfig,
  CreateCategoryDto,
  CreateTimeSlotDto,
} from './config';
export type {
  PaymentMethod,
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
} from './payment'; // ✅ Ajout des types de paiement
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
  ServiceItem,
} from './appointment';
// ✅ Export des fonctions (pas avec 'type')
export {
  getTotalPrice,
  getTotalDuration,
  getServiceNames,
} from './appointment';
export type {
  Service,
  ServiceCategory,
  CreateServiceDto,
  UpdateServiceDto,
} from './service';
export type { Review, ReviewStatus, SubmitReviewDto } from './review';
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
} from './payment';
export type {
  AppointmentSettings,
  UpdateAppointmentSettingsDto,
} from './appointmentSettings';
export type {
  LoyaltySettings,
  LoyaltySettingsUpdateDto,
} from './loyalty'; // ✅ Ajout des types de fidélité
export type {
  SpecialInfo,
  CreateSpecialInfoDto,
  UpdateSpecialInfoDto,
} from './specialInfo';
export type { ReferenceImage } from './appointment'; // ✅ Ajout du type ReferenceImage
export type {
  FrequentationStats,
  PointFrequentation,
  PageConsultee,
  Provenance,
  Appareil,
  Periode,
} from './audience';
export { PERIODES } from './audience';

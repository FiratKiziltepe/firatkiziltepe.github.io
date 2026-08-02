import type {
  AddConsumptionInput,
  AppRole,
  Category,
  CreateUserInput,
  Product,
  Profile,
  UpdateConsumptionInput,
  WeekData,
} from '../types'

export interface KantinRepository {
  getCurrentProfile(): Promise<Profile | null>
  signIn(username: string, password: string): Promise<Profile>
  signOut(): Promise<void>
  loadWeek(weekStart: string): Promise<WeekData>
  addConsumption(input: AddConsumptionInput): Promise<void>
  updateConsumption(entryId: number, input: UpdateConsumptionInput): Promise<void>
  setWeekPaid(customerId: string, weekStart: string, isPaid: boolean): Promise<void>
  saveCategory(category: Pick<Category, 'name' | 'sortOrder' | 'isActive'> & { id?: number }): Promise<void>
  saveProduct(product: Pick<Product, 'categoryId' | 'name' | 'currentPrice' | 'isActive'> & { id?: number }): Promise<void>
  createUser(input: CreateUserInput): Promise<void>
  resetPassword(userId: string, password: string): Promise<void>
  setUserActive(userId: string, isActive: boolean): Promise<void>
  updateProfile(userId: string, displayName: string): Promise<void>
  changeOwnPassword(password: string): Promise<void>
  isDemo: boolean
  demoUsers?: Array<{ username: string; password: string; role: AppRole }>
}

export type AppRole = 'customer' | 'canteen'

export interface Profile {
  id: string
  username: string
  displayName: string
  role: AppRole
  isManager: boolean
  isActive: boolean
  mustChangePassword: boolean
}

export interface Category {
  id: number
  name: string
  sortOrder: number
  isActive: boolean
}

export interface Product {
  id: number
  categoryId: number
  name: string
  currentPrice: number
  isActive: boolean
}

export interface ConsumptionEntry {
  id: number
  customerId: string
  productId: number
  productName: string
  categoryName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  consumedOn: string
  createdBy: string
  createdAt: string
  updatedBy: string | null
  updatedAt: string
  editReason: string | null
  revisionCount: number
  isCancelled: boolean
}

export interface ConsumptionRevision {
  id: number
  entryId: number
  customerId: string
  changedBy: string
  reason: string
  oldData: Record<string, unknown>
  newData: Record<string, unknown>
  changedAt: string
}

export interface WeeklyAccount {
  customerId: string
  weekStart: string
  isPaid: boolean
  totalSnapshot: number | null
  markedPaidBy: string | null
  markedPaidAt: string | null
}

export interface WeekData {
  profiles: Profile[]
  categories: Category[]
  products: Product[]
  entries: ConsumptionEntry[]
  revisions: ConsumptionRevision[]
  weeklyAccounts: WeeklyAccount[]
}

export interface AddConsumptionInput {
  customerId: string
  productId: number
  quantity: number
  consumedOn: string
}

export interface UpdateConsumptionInput {
  productId: number
  quantity: number
  consumedOn: string
  isCancelled: boolean
  reason: string
}

export interface CreateUserInput {
  username: string
  displayName: string
  password: string
  role: AppRole
  isManager: boolean
}

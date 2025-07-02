export const OTP_EXPIRE_IN_MINUTE = 10;

export const TRIAL_DAYS = 3;

export enum EducationDegrees {
  SECONDARY_SCHOOL = "Secondary School",
  HIGHER_SECONDARY = "Higher Secondary",
  UNDERGRADUATE = "Undergraduate",
  POST_GRADUATE = "Post Graduate",
  PHD = "PhD"
}

export enum MaritalStatus {
  SINGLE = "Single",
  MARRIED = "Married"
}

export enum UserRoles {
  SUPER_ADMIN = "Super Admin",
  DRIVER = "Driver",
  SHARE_HOLDER = "Share Holder",
  EMPLOYEE = "Employee"
}

export enum AttendanceStatus {
  PRESENT = "Present",
  ABSENT = "Absent",
  LATE = "Late",
  HALF_DAY = "Half-Day",
  WORK_FROM_HOME = "Work From Home",
  HOLIDAY = "Holiday",
  PAID_LEAVE = "Paid Leave",
  UNPAID_LEAVE = "Unpaid Leave"
}

export enum CheckoutStatus {
  REGULAR = "Regular",
  EARLY = "Early",
  OVERTIME = "Overtime"
}

export enum AccountStatus {
  UNVERIFIED = "Unverified",
  ADVANCE_PENDING = "Advance Pending",
  ADVANCE_FAILED = "Advance Failed",
  VERIFIED = "Verified",
  SUSPENDED = "Suspended",
  DEACTIVATED = "Deactivated",
  DELETED = "Deleted"
}

export enum ErrorReportRole {
  SYSTEM = "System",
  USER = "User"
}

export enum ApplicationServices {
  MIDDLEWARE = "Middleware",
  AUTHENTICATION = "Authentication",
  USER = "User"
}

export const DEFAULT_TOTAL_SHARES_REQUIRED = 10;

export const DEFAULT_PROFILE_COMPLETION_ARRAY = [
  {
    label: "Full name",
    fieldName: "fullName",
    status: "Incomplete",
    optional: false
  },
  {
    label: "Email",
    fieldName: "email",
    status: "Incomplete",
    optional: false
  },
  {
    label: "Image",
    fieldName: "picture",
    status: "Incomplete",
    optional: false
  },
  {
    label: "Phone",
    fieldName: "phone",
    status: "Incomplete",
    optional: false
  },
  {
    label: "Present Address",
    fieldName: "presentAddress",
    status: "Incomplete",
    optional: false
  },
  {
    label: "Permanent Address",
    fieldName: "permanentAddress",
    status: "Incomplete",
    optional: false
  },
  {
    label: "Date of Birth",
    fieldName: "dob",
    status: "Incomplete",
    optional: false
  },

  // =========== One is required from the following 3 ===========
  {
    label: "NID",
    fieldName: "nid",
    status: "Incomplete",
    optional: true
  },
  {
    label: "Birth Certificate",
    fieldName: "birthCertificate",
    status: "Incomplete",
    optional: true
  },
  {
    label: "Passport",
    fieldName: "passport",
    status: "Incomplete",
    optional: true
  }
  // ===========
];

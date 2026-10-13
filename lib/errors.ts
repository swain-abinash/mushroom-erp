/** A known, user-presentable failure raised by the service layer. */
export class ServiceError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status = 400,
    readonly field?: string,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

import {
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ErrorCode } from './error-codes';

/**
 * Application exception classes.
 *
 * No TR/EN strings — only an error code, an i18n key and optional metadata.
 * GlobalExceptionFilter serializes them to the standard envelope:
 *   { success: false, error: 'CODE', message: 'i18n_key', metadata?, statusCode }
 *
 * The frontend looks up the i18n key in errors.json and renders the
 * localized message to the user.
 *
 * Usage:
 *   throw new TenantContextMissingException();
 *   throw new EntityNotFoundException('Product', productId);
 *   throw new CodeDuplicateException('SKU-001');
 */

// ── Tenant ──

export class TenantContextMissingException extends BadRequestException {
  constructor() {
    super({
      error: ErrorCode.TENANT_CONTEXT_MISSING,
      message: 'errors.tenant.context_missing',
    });
  }
}

export class TenantForbiddenException extends ForbiddenException {
  constructor() {
    super({
      error: ErrorCode.TENANT_FORBIDDEN,
      message: 'errors.tenant.forbidden',
    });
  }
}

// ── Generic entity ──

export class EntityNotFoundException extends NotFoundException {
  constructor(entity: string, id: string) {
    super({
      error: ErrorCode.ENTITY_NOT_FOUND,
      message: 'errors.entity.not_found',
      metadata: { entity, id },
    });
  }
}

export class CodeDuplicateException extends ConflictException {
  constructor(code: string) {
    super({
      error: ErrorCode.CODE_DUPLICATE,
      message: 'errors.entity.code_duplicate',
      metadata: { code },
    });
  }
}

// ── Production (supplier production tracking) ──

export class SupplierProductionOrderNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: ErrorCode.SUPPLIER_PRODUCTION_ORDER_NOT_FOUND,
      message: 'errors.production.supplier_order_not_found',
      metadata: { id },
    });
  }
}

export class ProductionMilestoneNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: ErrorCode.PRODUCTION_MILESTONE_NOT_FOUND,
      message: 'errors.production.milestone_not_found',
      metadata: { id },
    });
  }
}

export class QualityCheckNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: ErrorCode.QUALITY_CHECK_NOT_FOUND,
      message: 'errors.production.qc_not_found',
      metadata: { id },
    });
  }
}

// ── Logistics (unified shipments) ──

export class ShipmentNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: ErrorCode.SHIPMENT_NOT_FOUND,
      message: 'errors.logistics.shipment_not_found',
      metadata: { id },
    });
  }
}

export class ShipmentDirectionInvalidException extends BadRequestException {
  constructor(direction: string) {
    super({
      error: ErrorCode.SHIPMENT_DIRECTION_INVALID,
      message: 'errors.logistics.shipment_direction_invalid',
      metadata: { direction },
    });
  }
}

/**
 * Thrown when an INBOUND shipment is created without a `purchaseOrderId`
 * or an OUTBOUND shipment is created without a `salesOrderId`. The XOR
 * is enforced in the service layer (DTO + business rule).
 */
export class ShipmentOrderReferenceRequiredException extends BadRequestException {
  constructor(direction: string) {
    super({
      error: ErrorCode.SHIPMENT_ORDER_REFERENCE_REQUIRED,
      message: 'errors.logistics.shipment_order_reference_required',
      metadata: { direction },
    });
  }
}

export class ContainerEventNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: ErrorCode.CONTAINER_EVENT_NOT_FOUND,
      message: 'errors.logistics.container_event_not_found',
      metadata: { id },
    });
  }
}

export class CustomsDeclarationNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: ErrorCode.CUSTOMS_DECLARATION_NOT_FOUND,
      message: 'errors.logistics.customs_declaration_not_found',
      metadata: { id },
    });
  }
}

export class FreightQuoteNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: ErrorCode.FREIGHT_QUOTE_NOT_FOUND,
      message: 'errors.logistics.freight_quote_not_found',
      metadata: { id },
    });
  }
}

export class ShipmentLegNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: ErrorCode.SHIPMENT_LEG_NOT_FOUND,
      message: 'errors.logistics.shipment_leg_not_found',
      metadata: { id },
    });
  }
}

export class CarrierPaymentNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: ErrorCode.CARRIER_PAYMENT_NOT_FOUND,
      message: 'errors.logistics.carrier_payment_not_found',
      metadata: { id },
    });
  }
}

// ── Accounting (landed cost) ──

export class LandedCostCalculationNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: ErrorCode.LANDED_COST_CALCULATION_NOT_FOUND,
      message: 'errors.accounting.landed_cost_calculation_not_found',
      metadata: { id },
    });
  }
}

/**
 * Thrown when a landed cost calculation is requested for a PO that
 * has no lines yet — there is nothing to allocate against.
 */
export class LandedCostPurchaseOrderEmptyException extends BadRequestException {
  constructor(purchaseOrderId: string) {
    super({
      error: ErrorCode.LANDED_COST_PURCHASE_ORDER_EMPTY,
      message: 'errors.accounting.landed_cost_purchase_order_empty',
      metadata: { purchaseOrderId },
    });
  }
}

/**
 * Thrown when the total quantity across all PO lines is zero, which
 * would cause a division-by-zero in the landed cost allocation.
 */
export class LandedCostQuantityZeroException extends BadRequestException {
  constructor(purchaseOrderId: string) {
    super({
      error: ErrorCode.LANDED_COST_QUANTITY_ZERO,
      message: 'errors.accounting.landed_cost_quantity_zero',
      metadata: { purchaseOrderId },
    });
  }
}

// ── Inventory ──

export class InventoryCutQuantityInvalidException extends BadRequestException {
  constructor() {
    super({
      error: ErrorCode.INVENTORY_CUT_QUANTITY_INVALID,
      message: 'errors.inventory.cut_quantity_invalid',
    });
  }
}

export class GoodsReceiveNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: ErrorCode.GOODS_RECEIVE_NOT_FOUND,
      message: 'errors.inventory.goods_receive_not_found',
      metadata: { id },
    });
  }
}

export class GoodsReceiveLineNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: ErrorCode.GOODS_RECEIVE_LINE_NOT_FOUND,
      message: 'errors.inventory.goods_receive_line_not_found',
      metadata: { id },
    });
  }
}

export class SupplierClaimNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: ErrorCode.SUPPLIER_CLAIM_NOT_FOUND,
      message: 'errors.inventory.supplier_claim_not_found',
      metadata: { id },
    });
  }
}

/**
 * Thrown when a supplier claim is being opened from a goods receive
 * line that has no discrepancy flagged on it.
 */
export class SupplierClaimNoDiscrepancyException extends BadRequestException {
  constructor(goodsReceiveLineId: string) {
    super({
      error: ErrorCode.SUPPLIER_CLAIM_NO_DISCREPANCY,
      message: 'errors.inventory.supplier_claim_no_discrepancy',
      metadata: { goodsReceiveLineId },
    });
  }
}

/**
 * Thrown when an attempt is made to open a second claim against a goods
 * receive line that already has one.
 */
export class SupplierClaimAlreadyOpenException extends ConflictException {
  constructor(goodsReceiveLineId: string, existingClaimId: string) {
    super({
      error: ErrorCode.SUPPLIER_CLAIM_ALREADY_OPEN,
      message: 'errors.inventory.supplier_claim_already_open',
      metadata: { goodsReceiveLineId, existingClaimId },
    });
  }
}

// ── IAM (roles) ──

export class SystemRoleDeleteForbiddenException extends ForbiddenException {
  constructor() {
    super({
      error: ErrorCode.ROLE_SYSTEM_DELETE_FORBIDDEN,
      message: 'errors.iam.system_role_delete_forbidden',
    });
  }
}

export class SystemRoleUpdateForbiddenException extends ForbiddenException {
  constructor() {
    super({
      error: ErrorCode.ROLE_SYSTEM_UPDATE_FORBIDDEN,
      message: 'errors.iam.system_role_update_forbidden',
    });
  }
}

// ── Auth ──

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super({
      error: ErrorCode.AUTH_INVALID_CREDENTIALS,
      message: 'errors.auth.invalid_credentials',
    });
  }
}

export class AccountDeactivatedException extends UnauthorizedException {
  constructor() {
    super({
      error: ErrorCode.AUTH_ACCOUNT_DEACTIVATED,
      message: 'errors.auth.account_deactivated',
    });
  }
}

export class UserNotFoundForImpersonationException extends UnauthorizedException {
  constructor(userId: string) {
    super({
      error: ErrorCode.AUTH_USER_NOT_FOUND_FOR_IMPERSONATION,
      message: 'errors.auth.user_not_found_for_impersonation',
      metadata: { userId },
    });
  }
}

// ── Users ──

export class UserEmailDuplicateException extends ConflictException {
  constructor(email: string) {
    super({
      error: ErrorCode.USER_EMAIL_DUPLICATE,
      message: 'errors.user.email_duplicate',
      metadata: { email },
    });
  }
}

export class UserTenantOwnerDeleteForbiddenException extends ConflictException {
  constructor() {
    super({
      error: ErrorCode.USER_TENANT_OWNER_DELETE_FORBIDDEN,
      message: 'errors.user.tenant_owner_delete_forbidden',
    });
  }
}

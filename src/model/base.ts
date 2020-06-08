export class TableColumn {
  title?: string;
  name: string;
  width?: number;
  hidden?: boolean;
  type?: string;
  readOnly?: boolean;
}

export class SimpleListParam {
  tableName: string;
  columns: string;
  orderBy: string;
  textSearch: string;
  page: number;
  pageSize: number;
  onlyMe: boolean;
  includeDisabled: boolean;
}

export class PayloadRes {
  payload: any[];
  fullCount: number;
}

export class RoleControl {
  controlId: string;
  controlCode: string;
  renderControl: boolean;
  disableControl: boolean;
  confirm: boolean;
  requirePassword: boolean;
}

export class AuthRequest {
  resetToken?: string;
  username: string;
  password: string;
}

export class Notification {
  id?: string;
  fromHumanId?: string;
  fromHumanFullName?: string;
  fromHumanAvatar?: string;
  toHumanId?: string;
  toHumanListIds?: string[];
  fromGroupId?: string;
  toGroupId?: string;
  menuPath?: string;
  departmentId?: string;
  departmentName?: string;
  targetId?: string;
  title: string;
  type?: string;
  messageType?: string;
  isRead?: boolean;
  isFinished?: boolean;
  createdDate?: number;
  isCancel?: boolean;
  top?: number;
  right?: number;
}

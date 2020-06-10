import { ViewStore } from 'src/store/view';
import { BehaviorSubject, of } from 'rxjs';
import { Project, File, TaskVerification, TaskQualification, Status, Task, Priority, StatusDetail } from '../types';
import { User } from 'src/model/user';
import { OwnerOrg } from 'src/modules/sys/owner-org/model';
import { TableUtilStore } from 'src/store/table-util';
import { RxHttp } from 'src/lib/js/rx-http';
import { toSnackCase } from 'src/lib/js/util';
import { Http } from 'src/lib/js/http';
import { SObject } from 'src/lib/js/sobject';
import { SJSON } from 'src/lib/js/sjson';
import { catchError } from 'rxjs/operators';
import { App } from 'src/lib/js/constants';

const BASE_URL = 'task/task/';
export default class Store {
  projects$ = new BehaviorSubject<Project[]>(undefined);
  priority$ = new BehaviorSubject<Priority[]>(undefined);
  uploadFiles$ = new BehaviorSubject<File[]>([]);

  taskVerification$ = new BehaviorSubject<TaskVerification[]>([]);
  taskQualification$ = new BehaviorSubject<TaskQualification[]>([]);

  taskStatus$ = new BehaviorSubject<Status[]>([]);

  taskList$ = new BehaviorSubject<Task[]>(undefined);
  projectList$ = new BehaviorSubject<Project[]>([]);

  showDashboard$ = new BehaviorSubject<boolean>(false);

  constructor(private view: ViewStore) {
    this.projectList$.next([
      { id: '1', name: 'SkyHub', inProgressTask: 5, completedTask: 15, notStartedTask: 2 },
      { id: '2', name: 'SkyOne', inProgressTask: 6, completedTask: 25, notStartedTask: 5 },
    ]);
  }

  findProjects = () => {
    TableUtilStore.getSimpleList({
      tableName: 'tsk_project',
      columns: 'id,name',
      orderBy: 'sort',
      textSearch: '',
      page: 1,
      pageSize: -1,
      onlyMe: false,
      includeDisabled: false,
    }).subscribe((res: any) => {
      this.projects$.next(res.data.payload);
    });
  };

  findPriorities = () => {
    TableUtilStore.getSimpleList({
      tableName: 'tsk_priority',
      columns: 'id,name',
      orderBy: 'sort',
      textSearch: '',
      page: 1,
      pageSize: -1,
      onlyMe: false,
      includeDisabled: false,
    }).subscribe((res: any) => {
      this.priority$.next(res.data.payload);
    });
  };

  findStatus = () => {
    TableUtilStore.getSimpleList({
      tableName: 'tsk_status',
      columns: 'id,name',
      orderBy: 'sort',
      textSearch: '',
      page: 1,
      pageSize: -1,
      onlyMe: false,
      includeDisabled: false,
    }).subscribe((res: any) => {
      this.taskStatus$.next(res.data.payload);
    });
  };

  findTaskVerification = () => {
    TableUtilStore.getSimpleList({
      tableName: 'tsk_task_verification',
      columns: 'id, code, name,percent',
      orderBy: 'sort',
      textSearch: '',
      page: 1,
      pageSize: -1,
      onlyMe: false,
      includeDisabled: false,
    }).subscribe((res: any) => {
      this.taskVerification$.next(res.data.payload);
    });
  };

  findTaskQualification = () => {
    TableUtilStore.getSimpleList({
      tableName: 'tsk_task_qualification',
      columns: 'id,name',
      orderBy: 'sort',
      textSearch: '',
      page: 1,
      pageSize: -1,
      onlyMe: false,
      includeDisabled: false,
    }).subscribe((res: any) => {
      this.taskQualification$.next(res.data.payload);
    });
  };

  tskFindTasks = (
    param: any = {
      menuPath: '',
      departmentId: '',
      page: 1,
      pageSize: App.DEFAULT_PAGE_SIZE,
      textSearch: '',
      isExactly: false,
      taskCode: '',
      taskName: '',
      projectName: '',
      assigneeName: '',
      assignerName: '',
      evaluatorName: '',
      submitStatus: '',
      isDelayDeadline: '',
      createdDateFrom: '',
      createdDateTo: '',
    },
  ) => {
    return RxHttp.get(`${BASE_URL}${toSnackCase('tskFindTasks')}`, {
      ...param,
      page: this.view.page,
      pageSize: this.view.pageSize,
    }).pipe(catchError((error) => of([])));
  };

  tskGetTaskById(id: string) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('tskGetTaskById')}`, {
      id,
    });
  }

  tskStatusCount(menuPath: string, depId: string) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('tskStatusCount')}`, {
      menuPath,
      depId,
    });
  }

  submitOrCancelSubmit(status: StatusDetail) {
    return RxHttp.put(`${BASE_URL}${toSnackCase('submitOrCancelSubmit')}`, SJSON.stringify(status));
  }
}

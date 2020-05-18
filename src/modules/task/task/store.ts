import { ViewStore } from '@/store/view';
import { BehaviorSubject } from 'rxjs';
import { Project, File, TaskVerification, TaskQualification, Status, Task, Priority, StatusDetail } from '../types';
import { User } from '@/model/user';
import { OwnerOrg } from '@/modules/sys/owner-org/model';
import { TableUtilStore } from '@/store/table-util';
import { RxHttp } from '@/lib/js/rx-http';
import { toSnackCase } from '@/lib/js/util';
import { Http } from '@/lib/js/http';
import { SObject } from '@/lib/js/sobject';
import { SJSON } from '@/lib/js/sjson';

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
      columns: 'id,name,percent',
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

  tskFindTasks = (menuPath: string, departmentId: string) => {
    const start = Date.now();
    RxHttp.get(`${BASE_URL}${toSnackCase('tskFindTasks')}`, {
      menuPath,
      departmentId,
      page: this.view.page,
      pageSize: this.view.pageSize,
    }).subscribe((res: any) => {
      const end = Date.now();
      console.log('Took ', end - start);

      if (res.data.payload.length === 0 && this.view.page > 1) {
        this.view.page--;
        this.tskFindTasks(menuPath, departmentId);
      } else {
        this.taskList$.next(res.data.payload);
        this.view.fullCount$.next(res.data.fullCount);
      }
    });
  };

  tskGetTaskById(id: string) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('tskGetTaskById')}`, {
      id,
    });
  }

  submitOrCancelSubmit(status: StatusDetail) {
    return RxHttp.put(`${BASE_URL}${toSnackCase('submitOrCancelSubmit')}`, SJSON.stringify(status));
  }
}

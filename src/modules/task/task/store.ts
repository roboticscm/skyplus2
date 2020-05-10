import { ViewStore } from '@/store/view';
import { BehaviorSubject } from 'rxjs';
import { Project, File, TaskVerification, TaskQualification, Status, Task, Priority } from '../types';
import { User } from '@/model/user';
import { OwnerOrg } from '@/modules/sys/owner-org/model';
import { TableUtilStore } from '@/store/table-util';
import { RxHttp } from '@/lib/js/rx-http';
import { toSnackCase } from '@/lib/js/util';

const BASE_URL = 'task/task/';
export default class Store {
  projects$ = new BehaviorSubject<Project[]>(undefined);
  priority$ = new BehaviorSubject<Priority[]>(undefined);
  uploadFiles$ = new BehaviorSubject<File[]>([]);

  taskVerification$ = new BehaviorSubject<TaskVerification[]>([]);
  taskQualification$ = new BehaviorSubject<TaskQualification[]>([]);

  assigneeStatusList$ = new BehaviorSubject<any[]>([]);
  assignerStatusList$ = new BehaviorSubject<any[]>([]);

  taskStatus$ = new BehaviorSubject<Status[]>([]);

  taskList$ = new BehaviorSubject<Task[]>(undefined);
  projectList$ = new BehaviorSubject<Project[]>([]);

  showDashboard$ = new BehaviorSubject<boolean>(false);

  constructor(private view: ViewStore) {
    this.taskVerification$.next([
      { id: '0', name: '0%' },
      { id: '1', name: '10%' },
      { id: '2', name: '20%' },
      { id: '3', name: '30%' },
      { id: '4', name: '40%' },
      { id: '5', name: '50%' },
      { id: '6', name: '60%' },
      { id: '7', name: '70%' },
      { id: '8', name: '80%' },
      { id: '9', name: '90%' },
      { id: '10', name: '100%' },
    ]);

    this.taskQualification$.next([
      { id: '0', name: 'Bad' },
      { id: '0', name: 'So so' },
      { id: '0', name: 'Good' },
      { id: '0', name: 'Excellent' },
    ]);

    this.assigneeStatusList$.next([
      { id: '1', date: new Date(), percent: '100%', note: 'Note1...', attach: 'xxxx' },
      { id: '2', date: new Date(), percent: '90%', note: 'Note2...' },
      { id: '1', date: new Date(), percent: '100%', note: 'Note1...' },
      { id: '2', date: new Date(), percent: '90%', note: 'Note2...' },
      { id: '1', date: new Date(), percent: '100%', note: 'Note1...' },
      { id: '2', date: new Date(), percent: '90%', note: 'Note2...' },
      { id: '1', date: new Date(), percent: '100%', note: 'Note1...' },
      { id: '2', date: new Date(), percent: '90%', note: 'Note2...' },
      { id: '1', date: new Date(), percent: '100%', note: 'Note1...', attach: 'xxxx' },
      {
        id: '2',
        date: new Date(),
        percent: '90%',
        note: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Corporis, ullam!',
      },
    ]);

    this.assignerStatusList$.next([
      { id: '1', date: new Date(), status: 'start doing...', note: 'Note1...', attach: 'xxxx' },
      { id: '2', date: new Date(), status: 'stop....', note: 'Note2...' },
    ]);

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

  tskFindTasks = (menuPath: string, departmentId: string) => {
    RxHttp.get(`${BASE_URL}${toSnackCase('tskFindTasks')}`, {
      menuPath,
      departmentId,
      page: this.view.page,
      pageSize: this.view.pageSize,
    }).subscribe((res: any) => {
      this.taskList$.next(res.data.payload);
    });
  };

  tskGetTaskById(id: string) {
    return RxHttp.get(`${BASE_URL}${toSnackCase('tskGetTaskById')}`, {
      id,
    });
  }
}

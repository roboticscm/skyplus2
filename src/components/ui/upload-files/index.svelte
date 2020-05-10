<script lang="ts">
  import { onMount } from 'svelte';
  import { T } from '@/lib/js/locale/locale';
  import { RxHttp } from '../../../lib/js/rx-http';
  import { take } from 'rxjs/operators';
  import CloseableList from '@/components/ui/closeable-list';
  import { App } from '@/lib/js/constants';

  export let selectPlaceholder = T('COMMON.LABEL.SELECT_FILE');
  export let dropPlaceholder = T('COMMON.LABEL.DROP_TO_UPLOAD');
  export let menuPath: string;
  export let id: string;
  export let savePath = 'upload_files';
  export let list: any[] = [];
  export let disabled = false;

  let uploadFilesRef: any;
  let uploadFileNames: any[] = list;
  let filenameRef: any;
  let fileRef: any;

  onMount(() => {
    window['$'](`#${id + 'File'}`).change(function(e) {
      uploadFiles((e.originalEvent.srcElement as any).files);
    });
  });

  const onDragover = (e: any) => {
    if (disabled) {
      return;
    }
    uploadFilesRef.classList.add('dragover');
    e.preventDefault();
  };

  const onDragleave = () => {
    if (disabled) {
      return;
    }
    uploadFilesRef.classList.remove('dragover');
  };

  const onDrop = (e: any) => {
    e.preventDefault();
    if (disabled) {
      return;
    }
    uploadFilesRef.classList.remove('dragover');
    uploadFiles(e.dataTransfer.files);
  };

  const convertArrayToFileNames = (arr: string[]) => {
    if (arr && arr.length > 0) {
      uploadFileNames = arr.map((it: string) => {
        const item = {
          id: it.length > App.UUID_LEN ? it.slice(0, App.UUID_LEN) : it,
          name: it.length > App.UUID_LEN ? it.slice(App.UUID_LEN, it.length) : it,
        };
        filenameRef.push(item);
        return item;
      });
    }
    list = filenameRef.getData();
  };

  const initFileNames = (arr: string[]) => {
    filenameRef && filenameRef.clearAll();
    if (arr && arr.length > 0 && arr[0]) {
      uploadFileNames = arr.map((it: string) => {
        const item = {
          id: it.length > App.UUID_LEN ? it.slice(0, App.UUID_LEN) : it,
          name: it.length > App.UUID_LEN ? it.slice(App.UUID_LEN, it.length) : it,
        };
        filenameRef.push(item);
        return item;
      });
    } else {
      uploadFileNames = [];
    }
  };

  const uploadFiles = (files: any) => {
    const formData = new FormData();
    for (let file of files) {
      formData.append('file[]', file);
    }

    RxHttp.upload('sys/upload', formData, savePath)
      .pipe(take(1))
      .subscribe((res: any) => {
        convertArrayToFileNames(res.data);
      });
  };

  export const getUploadFileNames = () => {
    return uploadFileNames;
  };

  const onSelectFile = () => {
    if (disabled) {
      return;
    }
    fileRef.click();
  };

  const onDeleteFile = (event: any) => {
    if (disabled) {
      return;
    }

    RxHttp.delete('sys/upload/delete', {
      filePath: savePath + '/' + event.detail.id + event.detail.name,
    })
      .pipe(take(1))
      .subscribe((res: any) => {
        console.log(res);
        list = filenameRef.getData();
      });
  };

  // @ts-ignore
  $: {
    initFileNames(list);
  }
</script>

<input type="file" style="display: none;" bind:this={fileRef} id={id + 'File'} multiple />
<div
  class="upload-files"
  bind:this={uploadFilesRef}
  on:dragover={onDragover}
  on:dragleave={onDragleave}
  on:drop={onDrop}>
  <CloseableList
    {disabled}
    directClose={true}
    bind:this={filenameRef}
    {menuPath}
    id={id + 'UploadFileId'}
    on:close={onDeleteFile} />
  <div class="upload-files__info">
    <i class="upload-files__info__icon fa fa-cloud-upload-alt" />
    <div class="upload-files__info__label">
      <span
        on:click={onSelectFile}
        class="upload-files__info__label__select {disabled ? '' : 'upload-files__info__label__hover'}
        ">
        {selectPlaceholder}
      </span>
      <span>&nbsp; {T('COMMON.LABEL.OR')} &nbsp;</span>
      <span>{dropPlaceholder}</span>
    </div>
  </div>

</div>

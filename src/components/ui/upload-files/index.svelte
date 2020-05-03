<script lang="ts">
  import { onMount } from 'svelte';
  import { T } from '@/lib/js/locale/locale';
  import { RxHttp } from '../../../lib/js/rx-http';
  import { take } from 'rxjs/operators';
  import CloseableList from '@/components/ui/closeable-list';

  export let selectPlaceholder = T('COMMON.LABEL.SELECT_FILE');
  export let dropPlaceholder = T('COMMON.LABEL.DROP_TO_UPLOAD');
  export let menuPath: string;
  export let id: string;
  export let savePath = '';

  let uploadFilesRef: any;
  let uploadFileNames: string[] = [];
  let filenameRef: any;
  let fileRef: any;

  onMount(() => {
    window['$'](`#${id + 'File'}`).change(function(e) {
      uploadFiles((e.originalEvent.srcElement as any).files);
    });
  });

  const onDragover = (e: any) => {
    uploadFilesRef.classList.add('dragover');
    e.preventDefault();
  };

  const onDragleave = () => {
    uploadFilesRef.classList.remove('dragover');
  };

  const onDrop = (e: any) => {
    e.preventDefault();
    uploadFilesRef.classList.remove('dragover');
    uploadFiles(e.dataTransfer.files);
  };

  const uploadFiles = (files: any) => {
    const formData = new FormData();
    for (let file of files) {
      formData.append('file[]', file);
    }

    RxHttp.upload('sys/upload', formData, savePath)
      .pipe(take(1))
      .subscribe((res: any) => {
        uploadFileNames = res.data.map((it: string) => {
          const uuidLen = 36;
          filenameRef.push({
            id: it.slice(0, uuidLen),
            name: it.slice(uuidLen, it.length),
          });
        });
      });
  };

  const onSelectFile = () => {
    fileRef.click();
  };

  const onDeleteFile = (event: any) => {
    RxHttp.delete('sys/upload/delete', {
      filePath: savePath + '/' + event.detail.id + event.detail.name,
    })
      .pipe(take(1))
      .subscribe((res: any) => {
        console.log(res);
      });
  };
</script>

<input type="file" style="display: none;" bind:this={fileRef} id={id + 'File'} multiple />
<div
  class="upload-files"
  bind:this={uploadFilesRef}
  on:dragover={onDragover}
  on:dragleave={onDragleave}
  on:drop={onDrop}>
  <CloseableList directClose="{true}" bind:this={filenameRef} {menuPath} id={id + 'UploadFileId'} on:close={onDeleteFile} />
  <div class="upload-files__info">
    <i class="upload-files__info__icon fa fa-cloud-upload-alt" />
    <div class="upload-files__info__label">
      <span on:click={onSelectFile} class="upload-files__info__label__select">{selectPlaceholder}</span>
      <span>&nbsp; {T('COMMON.LABEL.OR')} &nbsp;</span>
      <span>{dropPlaceholder}</span>
    </div>
  </div>

</div>

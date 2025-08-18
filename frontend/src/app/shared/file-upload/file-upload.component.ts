// src/app/shared/file-upload/file-upload.component.ts
import { Component, Output, EventEmitter, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { MatListModule } from '@angular/material/list';
// import { FileSizePipe } from '../pipes/file-size.pipe'; // see section 2

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, MatIconModule,MatButtonModule, MatListModule],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {
  @Input() acceptedTypes: string = '';
  @Input() multiple: boolean = false;
  @Output() filesSelected = new EventEmitter<File[]>();

  fileNames: string[] = [];
  dragOver = false;

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    this.handleFiles(files);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
    const files = event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [];
    this.handleFiles(files);
  }

  private handleFiles(files: File[]) {
    if (!this.multiple && files.length > 1) {
      files = [files[0]];
    }
    this.fileNames = files.map(f => f.name);
    this.filesSelected.emit(files);
  }
}
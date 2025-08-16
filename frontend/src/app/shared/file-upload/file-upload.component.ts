// src/app/shared/file-upload/file-upload.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { FileSizePipe } from '../pipes/file-size.pipe'; // see section 2

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatListModule, FileSizePipe],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {
  @Input() acceptedTypes: string = '';
  @Input() multiple: boolean = false;
  @Output() filesSelected = new EventEmitter<File[]>();

  selectedFiles: File[] = [];
  isDragOver: boolean = false;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const files = Array.from(event.dataTransfer?.files || []);
    this.handleFiles(files);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    this.handleFiles(files);
  }

  private handleFiles(files: File[]): void {
    this.selectedFiles = this.multiple ? [...this.selectedFiles, ...files] : files.slice(0, 1);
    this.filesSelected.emit(this.selectedFiles);
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.filesSelected.emit(this.selectedFiles);
  }
}

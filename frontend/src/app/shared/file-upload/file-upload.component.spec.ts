// src/app/shared/file-upload/file-upload.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileUploadComponent } from './file-upload.component';
// If TS complains about "jest", add "types": ["jest","node"] to tsconfig.spec.json
// or uncomment the next line:
// import { jest } from '@jest/globals';

describe('FileUploadComponent (Jest)', () => {
  let fixture: ComponentFixture<FileUploadComponent>;
  let component: FileUploadComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileUploadComponent], // standalone
    }).compileComponents();

    fixture = TestBed.createComponent(FileUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.acceptedTypes).toBe('');
    expect(component.multiple).toBe(false);
  });

  describe('onFileChange', () => {
    it('emits a single file when multiple=false and updates fileNames', () => {
      component.multiple = false;
      const f1 = new File(['a'], 'a.txt', { type: 'text/plain' });
      const f2 = new File(['b'], 'b.txt', { type: 'text/plain' });

      const emitSpy = jest.spyOn(component.filesSelected, 'emit');

      const event = { target: { files: [f1, f2] } } as any;
      component.onFileChange(event);

      expect(component.fileNames).toEqual(['a.txt']);
      expect(emitSpy).toHaveBeenCalledTimes(1);

      const lastCall = emitSpy.mock.calls[emitSpy.mock.calls.length - 1];
      const emitted = lastCall?.[0] as File[];
      expect(emitted.length).toBe(1);
      expect(emitted[0].name).toBe('a.txt');
    });

    it('emits all files when multiple=true', () => {
      component.multiple = true;
      const f1 = new File(['a'], 'a.txt');
      const f2 = new File(['b'], 'b.txt');

      const emitSpy = jest.spyOn(component.filesSelected, 'emit');
      const event = { target: { files: [f1, f2] } } as any;

      component.onFileChange(event);

      expect(component.fileNames).toEqual(['a.txt', 'b.txt']);
      const lastCall = emitSpy.mock.calls[emitSpy.mock.calls.length - 1];
      const emitted = lastCall?.[0] as File[];
      expect(emitted.map(f => f.name)).toEqual(['a.txt', 'b.txt']);
    });

    it('handles empty selection', () => {
      const emitSpy = jest.spyOn(component.filesSelected, 'emit');
      const event = { target: { files: [] } } as any;

      component.onFileChange(event);

      expect(component.fileNames).toEqual([]);
      const lastCall = emitSpy.mock.calls[emitSpy.mock.calls.length - 1];
      const emitted = lastCall?.[0] as File[];
      expect(emitted).toEqual([]);
    });
  });

  describe('drag & drop', () => {
    function makeDragEvent(files: File[] = []) {
      return {
        preventDefault: () => {},
        stopPropagation: () => {},
        dataTransfer: { files },
      } as any;
    }

    it('onDragOver sets dragOver=true', () => {
      const ev = makeDragEvent();
      component.onDragOver(ev);
      expect(component.dragOver).toBe(true);
    });

    it('onDragLeave sets dragOver=false', () => {
      component.dragOver = true;
      const ev = makeDragEvent();
      component.onDragLeave(ev);
      expect(component.dragOver).toBe(false);
    });

    it('onDrop emits files and resets dragOver', () => {
      component.dragOver = true;
      const f1 = new File(['a'], 'a.txt');
      const f2 = new File(['b'], 'b.txt');
      const emitSpy = jest.spyOn(component.filesSelected, 'emit');

      const ev = makeDragEvent([f1, f2]);
      component.multiple = true;
      component.onDrop(ev);

      expect(component.dragOver).toBe(false);
      expect(component.fileNames).toEqual(['a.txt', 'b.txt']);

      const lastCall = emitSpy.mock.calls[emitSpy.mock.calls.length - 1];
      const emitted = lastCall?.[0] as File[];
      expect(emitted.map(f => f.name)).toEqual(['a.txt', 'b.txt']);
    });

    it('onDrop respects multiple=false (keeps only first file)', () => {
      component.multiple = false;
      const f1 = new File(['a'], 'a.txt');
      const f2 = new File(['b'], 'b.txt');
      const emitSpy = jest.spyOn(component.filesSelected, 'emit');

      const ev = makeDragEvent([f1, f2]);
      component.onDrop(ev);

      expect(component.fileNames).toEqual(['a.txt']);

      const lastCall = emitSpy.mock.calls[emitSpy.mock.calls.length - 1];
      const emitted = lastCall?.[0] as File[];
      expect(emitted.length).toBe(1);
      expect(emitted[0].name).toBe('a.txt');
    });
  });
});

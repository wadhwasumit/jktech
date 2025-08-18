import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileUploadComponent } from './file-upload.component';

describe('FileUploadComponent', () => {
  let fixture: ComponentFixture<FileUploadComponent>;
  let component: FileUploadComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Standalone component: just import it
      imports: [FileUploadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FileUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.acceptedTypes).toBe('');
    expect(component.multiple).toBeFalse();
  });

  describe('onFileChange', () => {
    it('should emit a single file when multiple=false and update fileNames', () => {
      component.multiple = false;
      const f1 = new File(['a'], 'a.txt', { type: 'text/plain' });
      const f2 = new File(['b'], 'b.txt', { type: 'text/plain' });

      const emitSpy = spyOn(component.filesSelected, 'emit');

      // Simulate <input type="file"> change event
      const event = { target: { files: [f1, f2] } } as any;
      component.onFileChange(event);

      expect(component.fileNames).toEqual(['a.txt']);
      expect(emitSpy).toHaveBeenCalledTimes(1);
      const emitted = (emitSpy.calls.mostRecent().args[0] as File[]);
      expect(emitted.length).toBe(1);
      expect(emitted[0].name).toBe('a.txt');
    });

    it('should emit all files when multiple=true', () => {
      component.multiple = true;
      const f1 = new File(['a'], 'a.txt');
      const f2 = new File(['b'], 'b.txt');

      const emitSpy = spyOn(component.filesSelected, 'emit');
      const event = { target: { files: [f1, f2] } } as any;
      component.onFileChange(event);

      expect(component.fileNames).toEqual(['a.txt', 'b.txt']);
      const emitted = (emitSpy.calls.mostRecent().args[0] as File[]);
      expect(emitted.map(f => f.name)).toEqual(['a.txt', 'b.txt']);
    });

    it('should handle empty selection', () => {
      const emitSpy = spyOn(component.filesSelected, 'emit');
      const event = { target: { files: [] } } as any;
      component.onFileChange(event);

      expect(component.fileNames).toEqual([]);
      const emitted = (emitSpy.calls.mostRecent().args[0] as File[]);
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

    it('onDragOver should set dragOver=true', () => {
      const ev = makeDragEvent();
      component.onDragOver(ev);
      expect(component.dragOver).toBeTrue();
    });

    it('onDragLeave should set dragOver=false', () => {
      component.dragOver = true;
      const ev = makeDragEvent();
      component.onDragLeave(ev);
      expect(component.dragOver).toBeFalse();
    });

    it('onDrop should emit files and reset dragOver', () => {
      component.dragOver = true;
      const f1 = new File(['a'], 'a.txt');
      const f2 = new File(['b'], 'b.txt');
      const emitSpy = spyOn(component.filesSelected, 'emit');

      const ev = makeDragEvent([f1, f2]);
      component.multiple = true;
      component.onDrop(ev);

      expect(component.dragOver).toBeFalse();
      expect(component.fileNames).toEqual(['a.txt', 'b.txt']);
      const emitted = (emitSpy.calls.mostRecent().args[0] as File[]);
      expect(emitted.map(f => f.name)).toEqual(['a.txt', 'b.txt']);
    });

    it('onDrop respects multiple=false (keeps only first file)', () => {
      component.multiple = false;
      const f1 = new File(['a'], 'a.txt');
      const f2 = new File(['b'], 'b.txt');
      const emitSpy = spyOn(component.filesSelected, 'emit');

      const ev = makeDragEvent([f1, f2]);
      component.onDrop(ev);

      expect(component.fileNames).toEqual(['a.txt']);
      const emitted = (emitSpy.calls.mostRecent().args[0] as File[]);
      expect(emitted.length).toBe(1);
      expect(emitted[0].name).toBe('a.txt');
    });
  });
});

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  NonNullableFormBuilder,
  Validators,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ENTER, COMMA, SPACE } from '@angular/cdk/keycodes';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

import { IngestionApiService, IngestionJob } from '../../services/ingestion.service';
import { DocumentService } from '../../services/document.service';
import { AppDocument } from '../../models/document.model';

type IngestionForm = FormGroup<{
  documentIds: FormControl<string[]>;   // <- IDs only
  reindex: FormControl<boolean>;
}>;

type Suggestion = { id: string; name: string };

@Component({
  selector: 'app-ingestion-manager',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatProgressBarModule, MatTableModule,
    MatChipsModule, MatIconModule, MatAutocompleteModule
  ],
  templateUrl: './ingestion-manager.component.html',
  styleUrls: ['./ingestion-manager.component.scss']
})
export class IngestionManagerComponent implements OnInit {
  isLoading = false;
  jobs: IngestionJob[] = [];
  displayedColumns = ['jobId', 'docs', 'status', 'progress', 'updatedAt'];

  // form (initialized in ctor to avoid "fb used before init")
  form!: IngestionForm;

  // chips input shows names, form stores IDs
  docInputCtrl = new FormControl<Suggestion | string>('', { nonNullable: true });

  // suggestions & lookup
  allSuggestions: Suggestion[] = [];
  private idToName = new Map<string, string>();

  separatorKeysCodes = [ENTER, COMMA, SPACE];

  constructor(
    private api: IngestionApiService,
    private fb: NonNullableFormBuilder,
    private documentsService: DocumentService
  ) {
    this.form = this.fb.group({
      documentIds: this.fb.control<string[]>([], { validators: [requiredArrayValidator] }),
      reindex: this.fb.control(false),
    });
  }

  ngOnInit(): void {
    this.refresh();
    this.getAllDocuments();
  }

  /** Get available docs -> build {id, name} suggestions */
  getAllDocuments(): void {
    this.documentsService.getAllDocuments().subscribe({
      next: (docs: AppDocument[]) => {
        this.allSuggestions = (docs || []).map((d) => ({
          id: d.id,
          // pick best display name available
          name:  (d as any).originalName ?? (d as any).title ?? (d as any).name ?? (d as any).filename ?? d.id,
        }));
        this.rebuildIndex();
      },
      error: () => { /* ignore; UI still works with manual IDs */ }
    });
  }

  /** convenience getter for template */
  get documentIdsCtrl() { return this.form.controls.documentIds; }

  /** show name inside input for selected Suggestion */
  displaySuggestionName = (value?: Suggestion | string): string => {
    if (!value) return '';
    return typeof value === 'string' ? value : value.name;
  };

  /** filter by input text; exclude already-chosen IDs */
  filteredSuggestions(): Suggestion[] {
    const q = (typeof this.docInputCtrl.value === 'string'
      ? this.docInputCtrl.value
      : this.docInputCtrl.value?.name || '').toLowerCase();

    const chosen = new Set(this.documentIdsCtrl.value || []);
    return this.allSuggestions.filter(
      s => !chosen.has(s.id) && (s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
    );
  }

  /** add tokens from input (names or IDs) */
  addFromInput(event: MatChipInputEvent): void {
    const raw = (event.value || '').trim();
    if (!raw) { event.chipInput?.clear(); return; }

    const tokens = raw.split(/[,\s]+/).map(t => t.trim()).filter(Boolean);
    const nextIds = new Set(this.documentIdsCtrl.value || []);

    tokens.forEach(tok => {
      // resolve by name first, then by id; otherwise keep raw
      const byName = this.allSuggestions.find(s => s.name.toLowerCase() === tok.toLowerCase());
      const byId   = this.allSuggestions.find(s => s.id.toLowerCase()   === tok.toLowerCase());
      const id = byName?.id ?? byId?.id ?? tok;
      nextIds.add(id);
    });

    this.documentIdsCtrl.setValue(Array.from(nextIds));
    this.documentIdsCtrl.markAsDirty();

    event.chipInput?.clear();
    this.docInputCtrl.setValue('');
  }

  /** select from autocomplete -> push ID */
  selectSuggestion(e: MatAutocompleteSelectedEvent): void {
    const picked = e.option.value as Suggestion;
    if (!picked?.id) return;

    const next = new Set(this.documentIdsCtrl.value || []);
    next.add(picked.id);
    this.documentIdsCtrl.setValue(Array.from(next));
    this.documentIdsCtrl.markAsDirty();
    this.docInputCtrl.setValue('');
  }

  /** chip removal */
  remove(id: string): void {
    this.documentIdsCtrl.setValue((this.documentIdsCtrl.value || []).filter(x => x !== id));
    this.documentIdsCtrl.markAsDirty();
  }

  /** chip label: show name if known else the ID */
  displayChipName(id: string): string {
    return this.idToName.get(id) ?? id;
  }

  private rebuildIndex(): void {
    this.idToName = new Map(this.allSuggestions.map(s => [s.id, s.name]));
  }

  refresh(): void {
    this.isLoading = true;
    this.api.listJobs().subscribe({
      next: (jobs: IngestionJob[]) => { this.jobs = jobs; this.isLoading = false; },
      error: () => { this.isLoading = false; },
    });
  }

  trigger(): void {
    if (this.form.invalid) return;

    const documentIds = this.documentIdsCtrl.value || []; // IDs only
    const reindex = this.form.controls.reindex.value;

    this.isLoading = true;
    this.api.trigger(documentIds, reindex).subscribe({
      next: (res: any) => {
        const jobId: string | undefined = res?.jobId ?? res?.id ?? (res as IngestionJob)?.id;
        if (!jobId) { console.error('Unexpected trigger() response:', res); this.isLoading = false; return; }

        this.api.pollJob(jobId).subscribe({
          next: (job: IngestionJob) => {
            const idx = this.jobs.findIndex(j => j.id === job.id);
            if (idx >= 0) this.jobs[idx] = job; else this.jobs.unshift(job);
          },
          complete: () => this.refresh(),
        });
      },
      error: () => { this.isLoading = false; },
    });
  }

  cancel(jobId: string): void {
    this.api.cancel(jobId).subscribe(() => this.refresh());
  }
}

/** validator: require at least one item in array */
const requiredArrayValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const v = control.value as unknown;
  return Array.isArray(v) && v.length > 0 ? null : { required: true };
};

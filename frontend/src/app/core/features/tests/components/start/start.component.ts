import { Component, inject, input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Location } from '@angular/common';
import { availableTest } from '../../services/start.service';

@Component({
  selector: 'app-start',
  imports: [NgSelectModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="forms" class="mx-auto max-w-7xl py-4 sm:px-6 lg:px-8">
      <div class="px-4 sm:px-0">
        <h3 class="text-base/7 font-semibold text-gray-900">Test Starten</h3>
        <p class="mt-1 max-w-2xl text-sm/6 text-gray-500">
          Starten Sie einen neuen Test mit einem Testrunner.
        </p>
      </div>
      <div class="mt-6 border-t border-gray-100">
        <dl class="divide-y divide-gray-100">
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">Testdefinition</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              <ng-select
                formControlName="testDefinitionForm"
                [items]="availableTests()"
                bindLabel="name"
                bindValue="id"
                placeholder="Bitte auswählen"
                [multiple]="false"
                [searchable]="true"
                [closeOnSelect]="true"
                notFoundText="Keine Einträge gefunden"
                [clearable]="false"
              ></ng-select>
            </dd>
          </div>

          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">Testrunner</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              <ng-select
                formControlName="testRunnersForm"
                [items]=""
                bindLabel="name"
                bindValue="id"
                placeholder="Bitte auswählen"
                [multiple]="false"
                [searchable]="true"
                [closeOnSelect]="true"
                notFoundText="Keine Einträge gefunden"
                [clearable]="false"
              ></ng-select>
            </dd>
          </div>
        </dl>
        <div class="flex w-full justify-end gap-2">
          <button
            id="new-client-button"
            class="cursor-pointer block rounded-md bg-mhd px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-mhd/80"
            (click)="onBackButtonClicked()"
          >
            Abbrechen
          </button>
          <button
            id="new-client-button"
            class="cursor-pointer block rounded-md bg-mhd px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-mhd/80"
          >
            Test starten
          </button>
        </div>
      </div>
    </form>
  `,
  styles: ``,
})
export class StartComponent implements OnInit {
  private readonly location = inject(Location);

  availableTests = input<availableTest[]>();

  forms = new FormGroup({
    testDefinitionForm: new FormControl(null),
    testRunnersForm: new FormControl(null),
  });

  ngOnInit(): void {
    this.forms.controls.testRunnersForm.disable();

    this.forms.controls.testDefinitionForm.valueChanges.subscribe((value) => {
      if (value) {
        this.forms.controls.testRunnersForm.enable();
        this.forms.controls.testRunnersForm.reset();
      } else {
        this.forms.controls.testRunnersForm.disable();
        this.forms.controls.testRunnersForm.reset();
      }
    });
  }

  onBackButtonClicked() {
    this.location.back();
  }
}

/* import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class TestApiService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getRoot() {
    this.http.get(`${this.baseUrl}/`).subscribe(console.log);
  }

  getTestRunner() {
    this.http.get(`${this.baseUrl}/test-runner`).subscribe(console.log);
  }

  postStart() {
    this.http.post(`${this.baseUrl}/test/start`, {}).subscribe(console.log);
  }

  getAvailableTests() {
    this.http.get(`${this.baseUrl}/test/available-tests`).subscribe(console.log);
  }

  deleteTest() {
    this.http.delete(`${this.baseUrl}/test/delete/`).subscribe(console.log);
  }

  getTestById() {
    const id = 'd1d1d1d1-d1d1-4d1d-d1d1-d1d1d1d1d1d1';
    this.http.get(`${this.baseUrl}/test/${id}`).subscribe(console.log);
  }

  getStatus() {
    const id = 'd1d1d1d1-d1d1-4d1d-d1d1-d1d1d1d1d1d1';
    this.http.get(`${this.baseUrl}/test/${id}/status`).subscribe(console.log);
  }

  getRunners() {
    const id = 'e2e2e2e2-e2e2-4e2e-e2e2-e2e2e2e2e2e2';
    this.http.get(`${this.baseUrl}/test/${id}/runners`).subscribe(console.log);
  }

  postReload() {
    this.http.post(`${this.baseUrl}/test/reload`, {}).subscribe(console.log);
  }

  getLastReload() {
    this.http.get(`${this.baseUrl}/test/last-reload`).subscribe(console.log);
  }

  postRestart() {
    const id = 'd1d1d1d1-d1d1-4d1d-d1d1-d1d1d1d1d1d1';
    this.http.post(`${this.baseUrl}/test/${id}/restart`, {}).subscribe(console.log);
  }
} */

import { Routes } from '@angular/router';
import { TestsListComponent } from './core/features/tests/components/list/list.component';
import { DetailComponent } from './core/features/tests/components/detail/detail.component';
import { ListComponent as TestrunnerListComponent } from './core/features/testrunner/components/list/list.component';
import { DetailComponent as TestrunnerDetailComponent } from './core/features/testrunner/components/detail/detail.component';
import { TestListService } from './core/features/tests/services/list.service';
import { TestsListResolver } from './core/features/tests/resolver/test-list.resolver';
import { TestDetailSerivce } from './core/features/tests/services/details.service';
import { TestDetailResolver } from './core/features/tests/resolver/test-detail.resolver';
import { StartComponent } from './core/features/tests/components/start/start.component';
import { TestrunnerListSerivce } from './core/features/testrunner/services/list.service';
import { TestrunnerListResolver } from './core/features/testrunner/resolver/testrunner-list.resolver';
import { TestrunnerDetailSerivce } from './core/features/testrunner/services/details.service';
import { TestrunnerDetailResolver } from './core/features/testrunner/resolver/testrunner-details.resolver';
import { TestStartSerivce } from './core/features/tests/services/start.service';
import { AvailableTestResolver } from './core/features/tests/resolver/start-available-test.resolver';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/tests',
    pathMatch: 'full',
  },
  {
    path: 'tests',
    component: TestsListComponent,
    title: 'Sourcepark | Tests',
    providers: [TestListService, TestsListResolver],
    resolve: { tests: TestsListResolver },
  },
  {
    path: 'tests/start-test',
    component: StartComponent,
    title: 'Sourcepark | Start Test',
    providers: [TestStartSerivce, AvailableTestResolver],
    resolve: { availableTests: AvailableTestResolver },
  },
  {
    path: 'tests/:id',
    component: DetailComponent,
    title: 'Sourcepark | Test-1',
    providers: [TestDetailSerivce, TestDetailResolver],
    resolve: { testDetailData: TestDetailResolver },
  },
  {
    path: 'testrunner',
    component: TestrunnerListComponent,
    title: 'Sourcepark | Testrunner',
    providers: [TestrunnerListSerivce, TestrunnerListResolver],
    resolve: { testrunners: TestrunnerListResolver },
  },
  {
    path: 'testrunner/:id',
    component: TestrunnerDetailComponent,
    title: 'Sourcepark | Testrunner',
    providers: [TestrunnerDetailSerivce, TestrunnerDetailResolver],
    resolve: { testrunnerDetailData: TestrunnerDetailResolver },
  },
];

import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RecruteApi } from '../recrute-api';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-company-home',
  imports: [],
  templateUrl: './company-home.html',
  styleUrl: './company-home.scss',
})
export class CompanyHome {
  private route = inject(ActivatedRoute);
  userid = this.route.snapshot.params['id'];
  private readonly recruteApi = inject(RecruteApi);
  $company = this.recruteApi.getCompanybyId(this.userid);
  company = toSignal(this.$company);

}

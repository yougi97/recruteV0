import { Component, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RecruteApi } from '../recrute-api';
import { toSignal } from '@angular/core/rxjs-interop';
import { CandidateProfiles } from '../model/candidateProfiles';
import { User } from '../model/user';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-update-candidate',
  imports: [FormsModule],
  templateUrl: './update-candidate.html',
  styleUrl: './update-candidate.scss',
})
export class UpdateCandidate {
  private route = inject(ActivatedRoute);
  userid = this.route.snapshot.params['id'];
  private readonly recruteApi = inject(RecruteApi);
  $candidate = this.recruteApi.getCandidatebyId(this.userid);
  candidate = toSignal(this.$candidate);
  email: string = "";
  password: string = "";
  firstName?: string = "";
  lastName?: string = "";
  title?: string = "";
  location?: string = "";
  targetLocation?: JSON;
  bio?: string = "";
  private router = inject(Router);

  constructor() {
    // Quand le film est chargé → on initialise les champs
    console.log("UpdateCandidate loaded");
    effect(() => {
      const m = this.candidate();
      if (m) {
        this.email = m.user.email;
        this.password = m.user.password;
        this.firstName = m.user.firstName;
        this.lastName = m.user.lastName;
        this.title = m.title;
        this.location = m.location;
        this.targetLocation = m.targetLocation;
        this.bio = m.bio;
      }
    });
  }

  updateCandidate(candidates: CandidateProfiles): void {
    let user: User
    let data: CandidateProfiles
    user = {
      "id": candidates.user.id,
      "email": this.email,
      "password": this.password,
      "userType": candidates.user.userType,
      "firstName": this.firstName,
      "lastName": this.lastName,
      "createdAt": candidates.user.createdAt,
    }
    data = {
      "id": candidates.id,
      "user": user,
      "title": this.title,
      "location": this.location,
      "targetLocation": this.targetLocation,
      "bio": this.bio,
    };
    this.recruteApi.updateCandidate(data).subscribe(() => this.router.navigate(['/']));

  }

}

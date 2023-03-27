import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ForgetPasswordPageComponent } from './components/Auth/forget-password-page/forget-password-page.component';
import { LoginPageComponent } from './components/Auth/login-page/login-page.component';
import { RegisterPageComponent } from './components/Auth/register-page/register-page.component';

const routes: Routes = [
  {path: '', component: LoginPageComponent},

  {path: 'login', component: LoginPageComponent},
  {path: 'register', component: RegisterPageComponent},
  {path: 'password-reset', component: ForgetPasswordPageComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

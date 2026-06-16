import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit{

  loginForm!: FormGroup;
  hide = true;
  login_activo: boolean = true;
  ocultarPassword = true;  

  constructor(private formBuilder: FormBuilder, private router: Router){}


  onLogin() {
    if (this.loginForm.invalid) return;

    console.log(this.loginForm.value);

     this.router.navigate(['/principal']);

    // Aquí llamas tu API
  }

  ngOnInit(): void {
    this.login_activo = true;
    this.loginForm = this.formBuilder.group({
      user: [''],
      pass: ['']
    });    
  }

}

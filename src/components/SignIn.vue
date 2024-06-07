<template>
  <div class="center fade-in">
    <b-card
      title="Sign In"
      style="min-width: 12rem; max-width: 40rem"
      class="text-center container-fluid"
    >
      <b-form @submit="signIn">
        <b-form-group
          id="input-group-username"
          label-for="input-username"
          class="mb-2"
        >
          <b-input-group size="md" class="mb-2">
            <b-form-input
              id="siUId"
              name="username"
              v-model="form.username"
              type="text"
              placeholder="Username"
              required
            ></b-form-input>
          </b-input-group>
        </b-form-group>
        <b-form-group id="input-group-1" label-for="input-1" class="mb-2">
          <b-input-group size="md" class="mb-2">
            <b-form-input
              id="siPId"
              name="input-1"
              v-model="form.password"
              type="password"
              placeholder="Passphrase"
              autofocus
              required
            ></b-form-input>
          </b-input-group>
          <b-button type="submit" size="md" variant="info"> sign in </b-button>
        </b-form-group>
      </b-form>
      don't have an account yet?   
        <div 
          class="signup-button" 
          @click="goToSignUp">
          Sign Up
        </div>
      now!
    </b-card>
  </div>
</template>
<script>
  const Secp256k1 = require('@enumatech/secp256k1-js');
  import { EventBus } from '@/event-bus.js';
  
  export default {
    name: 'SignInWallet',
    emits: {
      signInWallet: (keys) => {
        return keys
      },
      showSignUp: () => {}
    },
    data: function() {
      return {
        form: {
          username: '',
          password: ''
        },
        show: true,
        showPassword: true,
        userPassword: ""
      };
    },
    methods: {
      goToSignUp: function (event) {
        event.preventDefault();
        EventBus.$emit('showSignUp')
      },
      signIn: function(event) {
        event.preventDefault();
        let keys = this.derive(this.form.password, this.form.username, 10);
        console.log(keys);
        EventBus.$emit('signInWallet', { keys: keys, username: this.form.username });
      },
      derive: function(passphrase, username, numKeys) {
        let keys = [];
        for (let x = 0; x < numKeys; x++) {
          const sec = Secp256k1.uint256(this.sha256(passphrase + username + x.toString()), 16);
          keys.push(sec.toString('hex').length == 63 ? '0' + sec.toString('hex') : sec.toString('hex'));
        }
        return keys;
      },
      sha256: function a(b){function c(a,b){return a>>>b|a<<32-b}for(var d,e,f=Math.pow,g=f(2,32),h="length",i="",j=[],k=8*b[h],l=a.h=a.h||[],m=a.k=a.k||[],n=m[h],o={},p=2;64>n;p++)if(!o[p]){for(d=0;313>d;d+=p)o[d]=p;l[n]=f(p,.5)*g|0,m[n++]=f(p,1/3)*g|0}for(b+="\x80";b[h]%64-56;)b+="\x00";for(d=0;d<b[h];d++){if(e=b.charCodeAt(d),e>>8)return;j[d>>2]|=e<<(3-d)%4*8}for(j[j[h]]=k/g|0,j[j[h]]=k,e=0;e<j[h];){var q=j.slice(e,e+=16),r=l;for(l=l.slice(0,8),d=0;64>d;d++){var s=q[d-15],t=q[d-2],u=l[0],v=l[4],w=l[7]+(c(v,6)^c(v,11)^c(v,25))+(v&l[5]^~v&l[6])+m[d]+(q[d]=16>d?q[d]:q[d-16]+(c(s,7)^c(s,18)^s>>>3)+q[d-7]+(c(t,17)^c(t,19)^t>>>10)|0),x=(c(u,2)^c(u,13)^c(u,22))+(u&l[1]^u&l[2]^l[1]&l[2]);l=[w+x|0].concat(l),l[4]=l[4]+w|0}for(d=0;8>d;d++)l[d]=l[d]+r[d]|0}for(d=0;8>d;d++)for(e=3;e+1;e--){var y=l[d]>>8*e&255;i+=(16>y?0:"")+y.toString(16)}
      return i}
    }
  }
  </script>
  
  <style scoped>
  @import url('https://fonts.googleapis.com/css2?family=Nunito&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Roboto&display=swap');
  
  
    .home {
      display: block;
      flex: 1;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 0 15px grey;
      height: 100%;
      width: 100%;
      color: black;
      font-family: 'Roboto' sans-serif;
      padding: 10px;
      font-size: 16px;
    }
  
    .center {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          padding: 10px;
      }
  
  
    #title {
      font-family: 'Roboto', sans-serif;
    }
  
    .form-field {
    font-family: 'Roboto', sans-serif;
    border-radius: 5px;
    font-size: 16px;
    height: 40px;
    width: 100%;
    border: none;
  }
    /** Setting this overrides default bootsrap .btn definition (can cause spacing issues) */
    .btn {
      background-color: rgb(0,195,235);
      font-family: 'Roboto', sans-serif;
      color: white;
      font-size: 16px;
    }
  
    .btn:hover {
      opacity: 0.8;
    }

    .signup-button {
      display: inline-block;
      color: rgb(0,195,235);
      text-align: center;
      cursor: pointer;
      user-select: none;
      transition: background-color 0.3s;
    }

    .signup-button:hover {
      opacity: 0.8;
    }
  </style>
  
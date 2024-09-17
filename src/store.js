// store.js
import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    user: null
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
    }
  },
  actions: {
    signIn({ commit }, user) {
      commit('setUser', user);
    }
  },
  getters: {
    isAdmin: state => state.user && state.user.role === 'admin'
  }
});

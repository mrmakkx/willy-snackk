const ADMIN_EMAIL = 'admin@willysnack.internal';

const loginSection = document.getElementById('admin-login');
const panelSection = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

function showPanel() {
  loginSection.hidden = true;
  panelSection.hidden = false;
  loadDishes();
}

function showLogin() {
  loginSection.hidden = false;
  panelSection.hidden = true;
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.hidden = true;
  const password = document.getElementById('login-password').value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password
  });

  if (error) {
    loginError.hidden = false;
    return;
  }

  showPanel();
});

logoutBtn.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  showLogin();
});

async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    showPanel();
  } else {
    showLogin();
  }
}

checkSession();

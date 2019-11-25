server 'i2ifacility.org', user: 'ubuntu', roles: %w{web app db}, primary: true

set :ssh_options, {
  forward_agent: true,
  auth_methods: %w(publickey)
}

set :deploy_to, '/var/www/i2i-msme'
set :node_env, 'production'
set :branch, 'master'

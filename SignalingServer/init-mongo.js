db = db.getSiblingDB('admin')

db.createUser({
  user: 'administrator',
  pwd: 'no1willguess',
  roles: [{
    role: 'userAdminAnyDatabase', db: 'admin'
  }]
});

db = db.getSiblingDB('signaling_db')

db.createUser({
  user: 'admin',
  pwd: '123456',
  roles: [{
    role: 'readWrite',
    db: 'signaling_db'
  }]
});

db.auth('admin', '123456')

db.signatest.save({ key: 'hehe', value: 'haha' })
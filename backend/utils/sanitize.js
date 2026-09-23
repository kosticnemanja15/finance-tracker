
// Polja koja smeju da napuste bazu. Koristi se kao Prisma `select`.
// passwordHash NIJE ovde — ne učitava se ni u memoriju servera.
export const USER_PUBLIC_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  isActive: true,
};

export function toUserDTO(user){
    return{
       id: user.id,
       name: user.name,
       email: user.email,
       role: user.role,
       createdAt: user.createdAt,
       isActive: user.isActive
    }
}

export function toUsersDTO(users){
    return users.map(toUserDTO);
}


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
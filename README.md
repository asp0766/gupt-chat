# GuptChat

GuptChat is a real-time anonymous chat application built using the MERN stack and Socket.IO. The idea behind this project was to create a simple platform where users can instantly communicate without creating an account. A room can be created within seconds, and anyone with the Room ID can join and start chatting.

The application focuses on fast communication, privacy, and a clean user experience. Along with text messaging, users can also share images, files, and voice recordings in real time.

## Live Demo

**Application:** https://gupt-chat.vercel.app

**Backend Health:** https://gupt-chat.onrender.com/health

---

## Features

- Create private chat rooms instantly
- Join existing rooms using a Room ID
- Real-time messaging powered by Socket.IO
- Image sharing with Cloudinary integration
- File sharing between room members
- Voice message recording and playback
- Admin-controlled chat rooms
- Remove users from a room
- Automatic room management
- Anonymous communication without registration
- Fast and responsive interface
- MongoDB Atlas cloud database
- Secure backend configuration using environment variables
- CORS protection and server-side validation
- Deployed with Vercel and Render

---

## Tech Stack

### Frontend

- React
- Vite
- JavaScript
- HTML5
- CSS3
- Socket.IO Client

### Backend

- Node.js
- Express.js
- Socket.IO
- MongoDB Atlas
- Cloudinary

### Deployment

- Vercel
- Render

---

## Project Structure

```text
GuptChat
│
├── client
│   ├── src
│   ├── public
│   └── package.json
│
├── server
│   ├── src
│   ├── uploads
│   └── package.json
│
├── .github
├── render.yaml
├── README.md
└── .gitignore
```

---

## How It Works

1. A user creates a new chat room.
2. A unique Room ID is generated.
3. Other users join using the Room ID.
4. Messages are delivered instantly through Socket.IO.
5. Images, files, and voice recordings are shared in real time.
6. The room creator becomes the admin and can remove members whenever required.

---

## Security

The project includes several measures to keep communication secure and reliable.

- Anonymous room-based communication
- No user registration required
- Environment variables for sensitive configuration
- MongoDB Atlas cloud database
- Secure Socket.IO communication
- CORS protection
- Server-side request validation
- Admin moderation for room management

---

## Installation

Clone the repository

```bash
git clone https://github.com/asp0766/gupt-chat.git
```

Move into the project

```bash
cd gupt-chat
```

Run the frontend

```bash
cd client
npm install
npm run dev
```

Run the backend

```bash
cd server
npm install
npm run dev
```

---

## Project Status

The application is fully deployed and running in production.

Frontend:
https://gupt-chat.vercel.app

Backend:
https://gupt-chat.onrender.com

---

## Developer

**Anurag Parmar**

GitHub  
https://github.com/asp0766

Portfolio  
https://asp0766.netlify.app

LinkedIn  
https://www.linkedin.com/in/asp0766/

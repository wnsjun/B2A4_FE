import './App.css';
import { Route, Routes } from 'react-router-dom';
import SplashPageWeb from './pages/Splash.tsx';
import Intro from './pages/Intro.tsx';
import LogIn from './pages/LogIn.tsx';
import SignUp from './pages/SignUp.tsx';
import SignUpHosp from './pages/SignUpHosp.tsx';
import Calendar from './pages/Calendar.tsx';
import AddSchedule from './pages/AddSchedule.tsx';
import EditSchedule from './pages/EditSchedule.tsx';
import Service from './pages/Service.tsx';
import Setting from './pages/Setting.tsx';
import Hospitalmap from './pages/Hospitalmap.tsx';
import SelectDoctor from './pages/SelectDoctor.tsx';
import FavoriteHospitals from './pages/FavoriteHospitals.tsx';
import QrCheckIn from './pages/QrCheckIn.tsx';
import PreQuestion1 from './pages/PreQuestion1.tsx';
import PreQuestion2 from './pages/PreQuestion2.tsx';
import PreQuestion3 from './pages/PreQuestion3.tsx';
import PatientChat from './pages/PatientChat.tsx';

function App() {
  return (
    <Routes>
      <Route path="/qr-checkin" element={<QrCheckIn />} />
      <Route path="/pre-question1" element={<PreQuestion1 />} />
      <Route path="/pre-question2" element={<PreQuestion2 />} />
      <Route path="/pre-question3" element={<PreQuestion3 />} />
      <Route path="/patientchat" element={<PatientChat />} />
      <Route path="/signup" element={<SignUp />} />

      <Route path="/signuphosp" element={<SignUpHosp />} />
      <Route
        path="*"
        element={
          <div style={{ width: '360px', height: '740px', margin: '0 auto' }}>
            <Routes>
              <Route path="/" element={<SplashPageWeb />} />
              <Route path="/logointro" element={<Intro />} />
              <Route path="/login" element={<LogIn />} />
              <Route path="/medical-records" element={<Calendar />} />
              <Route path="/add-schedule" element={<AddSchedule />} />
              <Route path="/edit-schedule" element={<EditSchedule />} />
              <Route path="/service" element={<Service />} />
              <Route path="/setting" element={<Setting />} />
              <Route path="/hospitalmap" element={<Hospitalmap />} />
              <Route path="/favorite-hospitals" element={<FavoriteHospitals />} />
              <Route path="/select-doctor" element={<SelectDoctor />} />
            </Routes>
          </div>
        }
      />
    </Routes>
  );
}

export default App;

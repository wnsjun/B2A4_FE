import { useNavigate } from 'react-router-dom';
import { useForm, type SubmitHandler } from 'react-hook-form';
import Button from '../components/Button';
import { isValidPassword } from '../utils/validation';
import FormInput from '../components/FormInput';
import { useIsMobile } from '../hooks/useIsMobile';
import { loginHospitalApi, loginPatientApi } from '../apis/auth';
import { useAuthStore } from '../hooks/useAuthStore';

type LoginFormInputs = {
  id: string;
  password: string;
};

const LogIn = () => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, dirtyFields, isValid },
  } = useForm<LoginFormInputs>({
    mode: 'onSubmit',
  });

  const nav = useNavigate();
  const isMobile = useIsMobile();
  const { setTokens } = useAuthStore();

  const handleSinup = () => {
    nav('/signup');
    // else nav('/signuphosp');
  };

  // src/pages/LogIn.tsx 의 onSubmit 함수

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    try {
      let response;

      // 1. API 호출
      if (isMobile) {
        response = await loginPatientApi({ loginId: data.id, pwd: data.password });
      } else {
        response = await loginHospitalApi({ loginId: data.id, pwd: data.password });
      }

      // 📸 CCTV 1: 서버가 준 전체 응답 확인
      console.log('1. 서버 응답 전체:', response);

      // 2. 토큰 꺼내기 (구조에 따라 다를 수 있음)
      // 만약 response.data가 없다면 여기서 에러가 날 겁니다.
      const { accessToken, refreshToken } = response.data;

      // 📸 CCTV 2: 꺼낸 토큰 확인
      console.log('2. 꺼낸 토큰:', accessToken);

      if (!accessToken) {
        alert('큰일 났다! 토큰이 없어요!');
        return;
      }

      // 3. 저장하기
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

      // 📸 CCTV 3: 저장 직후 확인
      console.log('3. 저장된 토큰 확인:', localStorage.getItem('accessToken'));

      // 4. 스토어 업데이트 및 이동
      setTokens(accessToken, refreshToken || '');

      if (isMobile) nav('/setting');
      else nav('/select-doctor');
    } catch (error: any) {
      console.error('로그인 에러 발생:', error);
      setError('password', { type: 'unauthorized', message: '로그인 실패' });
    }
  };

  return (
    <div
      className={
        'flex w-full h-screen flex-col' +
        (isMobile ? ' justify-around' : ' justify-center') +
        ' items-center p-[16px]'
      }
    >
      {isMobile ? (
        <div className="mb-[60px] mt-[160px]">
          <img src="../src/assets/typologo.svg" className="w-[88px]" />
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div>
            <img src="/sonbit.svg" className="w-[100px]" />
          </div>
          <div className="mb-[60px] mt-[16px]">
            <img src="../src/assets/typologo.svg" className="w-[72px]" />
          </div>
        </div>
      )}

      {/* 로그인 폼 */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col justify-between ">
        <div className="w-full gap-y-[16px] flex flex-col py-0">
          <FormInput
            label="id"
            type="text"
            placeholder="아이디를 입력하세요"
            register={register('id', { required: true })}
            isDirty={!!dirtyFields.id}
            error={!!errors.id || !!errors.root}
          />
          <FormInput
            label="pw"
            type="text"
            placeholder="비밀번호를 입력하세요"
            register={register('password', {
              validate: (value) => isValidPassword(value),
            })}
            isDirty={!!dirtyFields.password}
            error={!!errors.password}
          />
        </div>

        {/* button */}

        <div className="static bottom-0">
          <div className="w-full gap-[10px] flex flex-col mt-[40px] py-[12px]">
            <Button type="button" children="회원가입" onClick={handleSinup} isMobile={isMobile} />
            <Button
              type="submit"
              disabled={!isValid}
              variant="colored"
              children="로그인"
              isMobile={isMobile}
              onClick={() => nav('/hospitalmap')}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default LogIn;

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

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    try {
      let response;
      if (isMobile) {
        response = await loginPatientApi({
          loginId: data.id,
          pwd: data.password,
        });
        console.log('로그인 성공');

        const { accessToken, refreshToken } = response;
        setTokens(accessToken, refreshToken);
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        nav('/hospitalmap');
      } else {
        response = await loginHospitalApi({
          loginId: data.id,
          pwd: data.password,
        });
        console.log('로그인 성공');

        const { accessToken, refreshToken } = response;
        setTokens(accessToken, refreshToken);
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        nav('/select-doctor');
      }
    } catch (error: any) {
      console.error('로그인 실패: ', error);

      setError('password', {
        type: 'unauthorized',
        message: '아이디 또는 비밀번호를 확인해주세요.',
      });
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

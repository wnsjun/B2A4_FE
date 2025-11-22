import { useForm, type SubmitHandler } from 'react-hook-form';
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import { isValidPassword, isNameValid } from '../utils/validation';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';
import { defaultButtonText, Dirty } from '../styles/typography';
import Topbar from '../layouts/Topbar';
import { signupPatientApi } from '../apis/auth';

type SignUpFormInputs = {
  id: string;
  password: string;
  passwordConfirm: string;
  name: string;
};

const SignUp = () => {
  const nav = useNavigate();
  const isMobile = useIsMobile();

  //폼 관리자 호출
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, dirtyFields, isValid },
  } = useForm<SignUpFormInputs>({
    mode: 'onChange',
  });

  const passwordValue = watch('password', '');
  const passwordConfirmValue = watch('passwordConfirm', '');

  const isPwConfirmed =
    !!dirtyFields.passwordConfirm &&
    !errors.passwordConfirm &&
    passwordValue === passwordConfirmValue;

  const onSubmit: SubmitHandler<SignUpFormInputs> = async (data) => {
    const nameValue = watch('name', '');
    console.log('API로 전송할 최종 데이터:', data);

    // const payload = {
    //   id: data.id,
    //   password: data.password,
    //   deviceType: isMobile ? 'mobile' : 'desktop',
    //   name: data.name,
    // };

    if (isMobile) {
      try {
        await signupPatientApi({
          loginId: data.id,
          pwd: data.password,
          name: data.name,
        });
        alert('회원가입이 완료되었습니다.');
        nav('/service', {
          state: {
            fromSignup: true,
            userName: nameValue,
          },
        });
      } catch (error) {
        console.error('환자 가입 실패:', error);
        alert('회원가입 중 오류가 발생했습니다.');
      }
    } else {
      nav('/signuphosp', {
        state: {
          loginId: data.id, // 입력한 아이디
          pwd: data.password, // 입력한 비밀번호
        },
      });
    }
  };

  // const handleNextPage = () => {
  //   if (isMobile) {
  //     nav('/service', { state: { fromSignup: true, userName: nameValue } });
  //   } else {
  //     nav('/signuphosp', {state:{loginId: id}});
  //   }
  // };

  return (
    <div
      className={
        ' flex flex-col px-[20px] ' +
        (isMobile
          ? 'w-full h-[740px]  '
          : 'h-screen w-full justify-center items-center content-center')
      }
    >
      {isMobile && (
        <div>
          <Topbar title="회원가입" type="header" />
        </div>
      )}

      <div
        className={
          isMobile
            ? 'flex flex-col justify-start'
            : 'flex flex-col justify-center items-center content-center'
        }
      >
        <div
          style={defaultButtonText}
          className={
            isMobile
              ? `text-[24px] justify-items-start my-[40px] `
              : ' justify-center text-center mb-[132px]'
          }
        >
          가입 정보를 입력해주세요
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className={'flex-col justify-center items-center w-full'}
        >
          {/* 회원가입 폼 */}
          <div
            className={
              'flex flex-col justify-center gap-y-[8px]' + (!isMobile && ' px-[20px] mb-[60px]')
            }
          >
            <div>
              <div style={Dirty} className="text-[16px]">
                아이디
              </div>
              <FormInput
                label="id"
                type="text"
                placeholder="아이디를 입력하세요"
                register={register('id', {
                  required: '아이디를 입력하세요',
                })}
                error={!!errors.id}
                isDirty={!!dirtyFields.id}
              />
            </div>
            <div>
              <div style={Dirty} className="text-[16px]">
                비밀번호
              </div>
              <FormInput
                label="pw"
                type="text"
                placeholder="비밀번호를 입력하세요"
                register={register('password', {
                  validate: (value) => isValidPassword(value) || '영문, 숫자 포함 8자 이상',
                })}
                error={!!errors.password}
                isDirty={!!dirtyFields.password}
              />
            </div>
            <div>
              <FormInput
                label="repw"
                type="text"
                placeholder="비밀번호를 재입력하세요"
                register={register('passwordConfirm', {
                  validate: (value) => value === passwordValue || '비밀번호가 일치하지 않습니다.',
                })}
                error={!!errors.passwordConfirm}
                isDirty={!!dirtyFields.passwordConfirm}
                isConfirmed={isPwConfirmed}
              />
            </div>
          </div>

          {isMobile && (
            <div>
              <div style={Dirty} className="mt-[24px]">
                이름
              </div>
              <FormInput
                label="name"
                placeholder="이름을 입력하세요"
                register={register('name', {
                  validate: (name) => isNameValid(name),
                })}
                isDirty={!!dirtyFields.name}
              />
            </div>
          )}

          <div className="flex h-[48px] w-full items-center justify-center px-[20px]">
            <Button
              type="submit"
              className={isMobile ? 'fixed bottom-4' : 'w-[400px] mt-[40px]'}
              disabled={!isValid || !isPwConfirmed}
              variant={!isValid ? 'default' : 'colored'}
            >
              확인
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;

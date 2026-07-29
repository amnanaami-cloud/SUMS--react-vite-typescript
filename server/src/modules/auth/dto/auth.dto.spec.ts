import { validate } from 'class-validator';
import { ChangePasswordDto } from './auth.dto';

describe('password policy', () => {
  it('rejects a weak replacement password', async () => {
    const dto = Object.assign(new ChangePasswordDto(), { currentPassword: 'OldPassword!1', newPassword: 'weak' });
    expect(await validate(dto)).toEqual(expect.arrayContaining([expect.objectContaining({ property: 'newPassword' })]));
  });

  it('accepts a password with upper/lowercase, digit, symbol and minimum length', async () => {
    const dto = Object.assign(new ChangePasswordDto(), {
      currentPassword: 'OldPassword!1',
      newPassword: 'NewPassword!2',
    });
    expect(await validate(dto)).toHaveLength(0);
  });
});

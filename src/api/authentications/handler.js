/* eslint-disable max-len */
class AuthenticationsHandler {
  constructor(authenticationsService, usersService, tokenManager, validator) {
    this._authenticationsService = authenticationsService;
    this._usersService = usersService;
    this._tokenManager = tokenManager;
    this._validator = validator;

    this.postAuthenticationHandler = this.postAuthenticationHandler.bind(this);
    this.putAuthenticationHandler = this.putAuthenticationHandler.bind(this);
    this.deleteAuthenticationHandler = this.deleteAuthenticationHandler.bind(this);
  }

  async postAuthenticationHandler(request, h) {
    this._validator.validatePostAuthenticationPayload(request.payload);

    // dapatkan nilai username dan password dari payload, dan gunakan nilainya tersebut untuk memeriksa apakah kredensial yang dikirimkan pada request sesuai.
    const { username, password } = request.payload;
    const id = await this._usersService.verifyUserCredential(username, password);

    // membuat access token dan refresh token
    const accessToken = this._tokenManager.generateAccessToken({ id });
    const refreshToken = this._tokenManager.generateRefreshToken({ id });

    // menyimpan refreshToken ke database agar server mengenali refreshToken bila pengguna ingin memperbarui accessToken.
    await this._authenticationsService.addRefreshToken(refreshToken);

    const response = h.response({
      status: 'success',
      message: 'Authentication berhasil ditambahkan',
      data: {
        accessToken,
        refreshToken,
      },
    });
    response.code(201);
    return response;
  }

  async putAuthenticationHandler(request) {
    this._validator.validatePutAuthenticationPayload(request.payload);

    /*
     * dapatkan nilai refreshToken pada request.payload dan verifikasi refreshToken baik dari sisi database maupun signature token.
     * Lihat kode dalam memverifikasi signature refresh token, di sana kita menampung nilai id dari objek payload yang dikembalikan this.tokenManager.verifyRefreshToken.
     * Nilai id tersebut nantinya kita akan gunakan dalam membuat accessToken baru agar identitas pengguna tidak berubah.
     */
    const { refreshToken } = request.payload;
    await this._authenticationsService.verifyRefreshToken(refreshToken);
    const { id } = this._tokenManager.verifyRefreshToken(refreshToken);

    // membuat accessToken baru dan melampirkannya sebagai data di body respons.
    const accessToken = this._tokenManager.generateAccessToken({ id });
    return {
      status: 'success',
      message: 'Access Token berhasil diperbarui',
      data: {
        accessToken,
      },
    };
  }

  async deleteAuthenticationHandler(request) {
    this._validator.validateDeleteAuthenticationPayload(request.payload);

    const { refreshToken } = request.payload;
    // sebelum menghapusnya kita perlu memastikan refreshToken tersebut ada di database.
    await this._authenticationsService.verifyRefreshToken(refreshToken);
    // Setelah proses verifikasi refreshToken selesai, kita bisa lanjut menghapusnya dari database menggunakan fungsi this._authenticationsService.deleteRefreshToken.
    await this._authenticationsService.deleteRefreshToken(refreshToken);

    return {
      status: 'success',
      message: 'Refresh token berhasil dihapus',
    };
  }
}

module.exports = AuthenticationsHandler;

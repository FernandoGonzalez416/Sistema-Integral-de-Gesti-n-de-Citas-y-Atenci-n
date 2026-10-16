// Autorización por rol. Usar después de auth: router.get('/x', auth, permitir('ADMINISTRADOR'), ...).
export function permitir(...roles) {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return res.status(403).json({ ok: false, message: 'Permiso denegado' });
    }
    next();
  };
}

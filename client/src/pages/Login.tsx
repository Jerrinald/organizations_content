import { loginRequest } from '@/lib/auth-service'
import { errorMessage, isHttpError } from '@/lib/http-error'
import { decodeJwt } from '@/lib/jwt'
import { Route as LoginRoute } from '@/routes/login'
import { useAuthStore } from '@/stores/auth-store'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const schema = z.object({
  email: z.email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})
type FormValues = z.infer<typeof schema>

export default function Login() {
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const { redirect } = LoginRoute.useSearch()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormValues) => {
    try {
      const tokens = await loginRequest(data.email, data.password)
      const payload = decodeJwt(tokens.token)
      const email = payload?.username ?? data.email
      login(tokens.token, tokens.refresh_token, { email })
      await navigate({ to: redirect ?? '/dashboard' })
    } catch (err) {
      if (isHttpError(err) && err.status === 401) {
        setError('root', { message: 'Identifiants invalides' })
      } else if (isHttpError(err)) {
        setError('root', { message: errorMessage(err) })
      } else {
        console.log(err);

        setError('root', { message: 'Erreur réseau inattendue' })
      }
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-2xl font-semibold text-slate-900">Connexion</h1>

        <div className="space-y-1">
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
          />
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700"
          >
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
          />
          {errors.password && (
            <p className="text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {errors.root && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {errors.root.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isSubmitting ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </main>
  )
}

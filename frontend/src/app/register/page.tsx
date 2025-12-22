'use client';

import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {registerSchema, type RegisterData} from '@/types/auth';
import {register as registerUser} from '@/services/auth';
import {useSession} from '@/hooks/useSession';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Card, CardHeader, CardTitle, CardContent} from '@/components/ui/card';
import {ApiError} from '@/types/api';

export default function RegisterPage() {
	const router = useRouter();
	const {session, isLoading: sessionLoading} = useSession();
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const {
		register,
		handleSubmit,
		formState: {errors},
	} = useForm<RegisterData>({
		resolver: zodResolver(registerSchema),
	});

	useEffect(() => {
		if (!sessionLoading && session?.isAuthenticated) {
			router.push('/dashboard');
		}
	}, [sessionLoading, session, router]);

	const onSubmit = async (data: RegisterData) => {
		setError('');
		setIsLoading(true);

		try {
			await registerUser(data);
			router.push('/login');
		} catch (err) {
			setError((err as ApiError).message || 'Registration failed');
		} finally {
			setIsLoading(false);
		}
	};

	if (sessionLoading || session?.isAuthenticated) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p>Loading...</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl text-center">Register</CardTitle>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-4">
						{error && (
							<div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
								{error}
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="username">Username</Label>
							<Input
								id="username"
								{...register('username')}
							/>
							{errors.username && (
								<p className="text-sm text-destructive">{errors.username.message}</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								{...register('email')}
							/>
							{errors.email && (
								<p className="text-sm text-destructive">{errors.email.message}</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								{...register('password')}
							/>
							{errors.password && (
								<p className="text-sm text-destructive">{errors.password.message}</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="name">Name (Optional)</Label>
							<Input
								id="name"
								{...register('name')}
							/>
						</div>

						<Button
							type="submit"
							className="w-full"
							disabled={isLoading}>
							{isLoading ? 'Creating account...' : 'Register'}
						</Button>

						<p className="text-center text-sm text-muted-foreground">
							Already have an account?{' '}
							<Link
								href="/login"
								className="text-primary hover:underline">
								Login here
							</Link>
						</p>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

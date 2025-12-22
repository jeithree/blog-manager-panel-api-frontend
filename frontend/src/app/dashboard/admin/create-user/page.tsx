'use client';

import {useState} from 'react';
import Link from 'next/link';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {useSession} from '@/hooks/useSession';
import {createUser} from '@/services/admin';
import {createUserSchema, type CreateUserInput} from '@/types/admin';
import type {ApiError} from '@/types/api';

export default function AdminCreateUserPage() {
	const {session, isLoading} = useSession();
	const isAdmin = session?.user?.role === 'ADMIN';
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const {
		register,
		handleSubmit,
		reset,
		formState: {errors, isSubmitting},
	} = useForm<CreateUserInput>({
		resolver: zodResolver(createUserSchema),
		defaultValues: {
			username: '',
			email: '',
			password: '',
			name: '',
		},
	});

	const onSubmit = async (data: CreateUserInput) => {
		setError('');
		setSuccess('');

		try {
			await createUser(data);
			setSuccess('User created successfully.');
			reset();
		} catch (err) {
			setError((err as ApiError).message || 'Failed to create user');
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p>Loading...</p>
			</div>
		);
	}

	if (!isAdmin) {
		return (
			<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
				<Card>
					<CardHeader>
						<CardTitle>Access Denied</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-muted-foreground">
							You do not have permission to view this page.
						</p>
						<Link href="/dashboard">
							<Button variant="outline">Return to dashboard</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
			<div className="flex items-center justify-between mb-6">
				<div>
					<p className="text-sm text-muted-foreground">Admin tools</p>
					<h1 className="text-2xl font-bold">Create a new user</h1>
				</div>
				<Link href="/dashboard">
					<Button variant="outline">Back</Button>
				</Link>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>User details</CardTitle>
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

						{success && (
							<div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-md border border-emerald-200">
								{success}
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="username">Username</Label>
							<Input
								id="username"
								placeholder="newuser"
								{...register('username')}
							/>
							{errors.username && (
								<p className="text-sm text-destructive">
									{errors.username.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="user@example.com"
								{...register('email')}
							/>
							{errors.email && (
								<p className="text-sm text-destructive">
									{errors.email.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								placeholder="Strong password"
								{...register('password')}
							/>
							{errors.password && (
								<p className="text-sm text-destructive">
									{errors.password.message}
								</p>
							)}
							<p className="text-xs text-muted-foreground">
								Must include upper and lowercase letters, a number, and a
								special character.
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="name">Name (optional)</Label>
							<Input
								id="name"
								placeholder="Full name"
								{...register('name')}
							/>
							{errors.name && (
								<p className="text-sm text-destructive">
									{errors.name.message}
								</p>
							)}
						</div>

						<Button
							type="submit"
							className="w-full"
							disabled={isSubmitting}>
							{isSubmitting ? 'Creating user...' : 'Create user'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

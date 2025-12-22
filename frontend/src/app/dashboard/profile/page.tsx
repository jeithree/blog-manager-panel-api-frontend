'use client';

import {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import useSWR from 'swr';
import {updateProfileSchema, type UpdateProfileData} from '@/types/user';
import {getProfile, updateProfile} from '@/services/user';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Card, CardHeader, CardTitle, CardContent} from '@/components/ui/card';
import {ApiError} from '@/types/api';

export default function ProfilePage() {
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const {data: profileData, mutate} = useSWR('/api/v1/users/me', async () => {
		const response = await getProfile();
		return response.data;
	});

	const {
		register,
		handleSubmit,
		reset,
		formState: {errors},
	} = useForm<UpdateProfileData>({
		resolver: zodResolver(updateProfileSchema),
		defaultValues: {
			name: '',
			currentPassword: '',
			newPassword: '',
		},
	});

	useEffect(() => {
		if (profileData) {
			reset({
				name: profileData.name || '',
				currentPassword: '',
				newPassword: '',
			});
		}
	}, [profileData, reset]);

	const onSubmit = async (data: UpdateProfileData) => {
		setError('');
		setSuccess('');
		setIsLoading(true);

		try {
			await updateProfile(data);
			await mutate();
			setSuccess('Profile updated successfully');
			reset({
				name: profileData?.name || '',
				currentPassword: '',
				newPassword: '',
			});
		} catch (err) {
			setError((err as ApiError).message || 'Failed to update profile');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="max-w-2xl mx-auto px-4 py-8">
			<Card>
				<CardHeader>
					<CardTitle>Profile Settings</CardTitle>
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
							<div className="bg-green-50 text-green-700 text-sm p-3 rounded-md">
								{success}
							</div>
						)}

						<div className="space-y-2">
							<Label>Username</Label>
							<Input
								value={profileData?.username || ''}
								disabled
							/>
							<p className="text-xs text-muted-foreground">
								Username cannot be changed
							</p>
						</div>

						<div className="space-y-2">
							<Label>Email</Label>
							<Input
								value={profileData?.email || ''}
								disabled
							/>
							<p className="text-xs text-muted-foreground">
								Email cannot be changed
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								{...register('name')}
							/>
							{errors.name && (
								<p className="text-sm text-destructive">
									{errors.name.message}
								</p>
							)}
						</div>

						<hr className="border-muted/50" />

						<div>
							<h2 className="text-lg font-semibold">Change password</h2>
							<p className="text-sm text-muted-foreground">
								Enter your current password and a new password to update it.
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="currentPassword">Current password</Label>
							<Input
								id="currentPassword"
								type="password"
								{...register('currentPassword')}
							/>
							{errors.currentPassword && (
								<p className="text-sm text-destructive">
									{errors.currentPassword.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="newPassword">New password</Label>
							<Input
								id="newPassword"
								type="password"
								{...register('newPassword')}
							/>
							{errors.newPassword && (
								<p className="text-sm text-destructive">
									{errors.newPassword.message}
								</p>
							)}
							<p className="text-xs text-muted-foreground">
								Must include upper and lowercase letters, a number, and a
								special character.
							</p>
						</div>

						<Button
							type="submit"
							disabled={isLoading}>
							{isLoading ? 'Updating...' : 'Update Profile'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 100,
    nullable: true,
  })
  name: string;

  @Column({
    unique: true,
  })
  githubId: string;

  @Column({
    nullable: true,
  })
  avatarUrl: string;
}

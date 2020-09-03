import * as firebase from 'firebase/app';
import 'firebase/firestore';

import {Deck} from '../../../models/data/deck';
import {DeployData} from '../../../models/data/deploy';

import deckStore from '../../../stores/deck.store';
import deployStore from '../../../stores/deploy.store';
import authStore from '../../../stores/auth.store';
import errorStore from '../../../stores/error.store';

export class DeployService {
  private static instance: DeployService;

  private constructor() {
    // Private constructor, singleton
  }

  static getInstance() {
    if (!DeployService.instance) {
      DeployService.instance = new DeployService();
    }
    return DeployService.instance;
  }

  snapshot(): Promise<() => void | undefined> {
    return new Promise<() => void | undefined>((resolve) => {
      const deck: Deck = deckStore.state.deck;

      if (!deck || !deck.id) {
        deployStore.reset();

        resolve(undefined);
        return;
      }

      if (!authStore.state.gitHub) {
        deployStore.reset();

        resolve(undefined);
        return;
      }

      const firestore: firebase.firestore.Firestore = firebase.firestore();
      const unsubscribe = firestore
        .collection(`deploys`)
        .doc(deck.id)
        .onSnapshot(
          (deploySnapshot: firebase.firestore.DocumentSnapshot<DeployData>) => {
            deployStore.state.deploy = {
              id: deploySnapshot.id,
              data: deploySnapshot.data(),
            };
          },
          (_err) => {
            errorStore.state.error = 'GitHub deploy information cannot be retrieved.';
          }
        );

      resolve(unsubscribe);
    });
  }
}